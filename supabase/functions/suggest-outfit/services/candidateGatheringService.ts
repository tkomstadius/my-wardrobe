import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface CandidateSignals {
  /** The user's own rating of the item: 1 = good, 0 = meh, -1 = nope, null = unrated. */
  userRating: number | null;
  /** How often the item gets worn, normalised by how long it's been owned. */
  wearsPerMonth: number;
  /** null when never worn in the app. */
  daysSinceWorn: number | null;
  /** Logged outfits containing this item, by outfit rating. */
  goodOutfits: number;
  nopeOutfits: number;
}

export interface CandidateItem {
  id: string;
  category: string;
  subCategory: string | null;
  brand: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  pastOutfitNotes: string[];
  signals: CandidateSignals;
}

export interface FavoriteOutfit {
  itemIds: string[];
  notes: string | null;
}

export interface CandidatePool {
  candidates: CandidateItem[];
  /** Past outfits rated good whose items are all in `candidates` — style references for the
   *  composer, not answers to copy. */
  favoriteOutfits: FavoriteOutfit[];
}

export interface GatherOptions {
  /** Hard-excluded (e.g. the suggestion the user just rejected with "Try another"). */
  excludeItemIds: string[];
  /** Soft-penalised (e.g. everything already shown earlier in this suggestion session). */
  avoidItemIds: string[];
}

export interface CandidateGatheringService {
  gather(options: GatherOptions): Promise<CandidatePool>;
}

interface ItemRow {
  id: string;
  category: string;
  sub_category: string | null;
  brand: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  rating: number | null;
  wear_count: number | null;
  wear_history: string[] | null;
  purchase_date: string | null;
  created_at: string;
}

interface OutfitRow {
  item_ids: string[] | null;
  notes: string | null;
  rating: number | null;
  created_at: string;
}

// A large wardrobe (hundreds of items) sent whole would bloat the prompt to the point the model
// loses track of which real id corresponds to the outfit concept it settles on — observed in
// testing as a rationale describing a t-shirt/pants/jacket while the returned itemIds were
// unrelated shoes/bags. So the prompt only ever sees a bounded sample per category. The sample is
// *weighted random* rather than a fixed top-N: a fixed sort always surfaced the same handful of
// items, whereas sampling lets every call look at a different slice of the wardrobe at the same
// prompt size (and cost), while still leaning toward what the user actually wears and likes.
const MAX_CANDIDATES_PER_CATEGORY = 8;
const MAX_FAVORITE_OUTFITS = 3;
const MAX_NOTES_PER_ITEM = 3;
// Worn this recently → not suggested at all; worn within RECENT_DAYS → down-weighted.
const JUST_WORN_DAYS = 2;
const RECENT_DAYS = 7;
const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / DAY_MS;
}

function lastWorn(wearHistory: string[] | null): string | null {
  if (!wearHistory || wearHistory.length === 0) return null;
  // wear_history is appended to, but don't rely on order.
  return wearHistory.reduce((latest, d) => (d > latest ? d : latest));
}

/** Higher = more likely to be sampled. Every eligible item keeps a non-zero weight, so rarely
 *  worn pieces still turn up occasionally instead of never. */
function itemWeight(signals: CandidateSignals, avoided: boolean): number {
  let weight = 1;

  if (signals.userRating === 1) weight *= 2;
  else if (signals.userRating === -1) weight *= 0.15;

  // Laplace-smoothed outfit affinity in roughly [-1, 1]: a couple of good outfits matter, a
  // single one doesn't dominate.
  const outfitAffinity =
    (signals.goodOutfits - 2 * signals.nopeOutfits) /
    (signals.goodOutfits + signals.nopeOutfits + 2);
  weight *= 1 + Math.max(-0.8, outfitAffinity);

  // Log-scaled so staples are favoured without crowding everything else out.
  weight *= 1 + Math.log1p(signals.wearsPerMonth);

  if (signals.daysSinceWorn !== null && signals.daysSinceWorn < RECENT_DAYS) weight *= 0.4;
  if (avoided) weight *= 0.25;

  return weight;
}

/** Weighted sampling without replacement (Efraimidis–Spirakis): key = u^(1/w), keep top k. */
function weightedSample<T>(entries: { value: T; weight: number }[], k: number): T[] {
  return entries
    .map((e) => ({ value: e.value, key: Math.random() ** (1 / e.weight) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, k)
    .map((e) => e.value);
}

/** Uses the caller-scoped Supabase client passed in from the orchestrator — never a service-role
 *  client — so every read here stays governed by the caller's own RLS policies. */
export function createCandidateGatheringService(supabase: SupabaseClient): CandidateGatheringService {
  return {
    async gather({ excludeItemIds, avoidItemIds }: GatherOptions): Promise<CandidatePool> {
      const [{ data: items, error: itemsError }, { data: outfits, error: outfitsError }] =
        await Promise.all([
          supabase
            .from('wardrobe_items')
            .select(
              'id, category, sub_category, brand, description, metadata, notes, rating, ' +
                'wear_count, wear_history, purchase_date, created_at',
            )
            .is('archived_at', null)
            .returns<ItemRow[]>(),
          supabase
            .from('outfits')
            .select('item_ids, notes, rating, created_at')
            .order('created_at', { ascending: false })
            .returns<OutfitRow[]>(),
        ]);

      if (itemsError) {
        throw new Error(`Failed to load candidate items: ${itemsError.message}`);
      }
      if (outfitsError) {
        throw new Error(`Failed to load outfits: ${outfitsError.message}`);
      }

      // Outfits come back newest first, so notes are naturally most-recent-first too.
      const notesByItemId = new Map<string, string[]>();
      const goodByItemId = new Map<string, number>();
      const nopeByItemId = new Map<string, number>();
      for (const outfit of outfits ?? []) {
        for (const itemId of outfit.item_ids ?? []) {
          if (outfit.notes) {
            const existing = notesByItemId.get(itemId) ?? [];
            if (existing.length < MAX_NOTES_PER_ITEM) existing.push(outfit.notes);
            notesByItemId.set(itemId, existing);
          }
          if (outfit.rating === 1) goodByItemId.set(itemId, (goodByItemId.get(itemId) ?? 0) + 1);
          if (outfit.rating === -1) nopeByItemId.set(itemId, (nopeByItemId.get(itemId) ?? 0) + 1);
        }
      }

      const excluded = new Set(excludeItemIds);
      const avoided = new Set(avoidItemIds);
      const eligible = new Map<string, { item: ItemRow; signals: CandidateSignals }>();

      for (const item of items ?? []) {
        if (excluded.has(item.id)) continue;

        const worn = lastWorn(item.wear_history);
        const daysSinceWorn = worn ? daysSince(worn) : null;
        if (daysSinceWorn !== null && daysSinceWorn < JUST_WORN_DAYS) continue;

        const ownedMonths = Math.max(1, daysSince(item.purchase_date ?? item.created_at) / 30);
        eligible.set(item.id, {
          item,
          signals: {
            userRating: item.rating,
            wearsPerMonth: Math.round(((item.wear_count ?? 0) / ownedMonths) * 100) / 100,
            daysSinceWorn: daysSinceWorn === null ? null : Math.round(daysSinceWorn),
            goodOutfits: goodByItemId.get(item.id) ?? 0,
            nopeOutfits: nopeByItemId.get(item.id) ?? 0,
          },
        });
      }

      // Seed the pool with a few liked outfits (random, leaning recent) so the composer has
      // concrete examples of the user's taste and can remix around them.
      const goodOutfits = (outfits ?? [])
        .filter((o) => o.rating === 1)
        .map((o) => ({ ...o, itemIds: (o.item_ids ?? []).filter((id) => eligible.has(id)) }))
        .filter((o) => o.itemIds.length >= 2);
      const favoriteOutfits: FavoriteOutfit[] = weightedSample(
        goodOutfits.map((o) => ({ value: o, weight: 1 / (1 + daysSince(o.created_at) / 90) })),
        MAX_FAVORITE_OUTFITS,
      ).map((o) => ({ itemIds: o.itemIds, notes: o.notes }));

      const chosen = new Set(favoriteOutfits.flatMap((o) => o.itemIds));

      const byCategory = new Map<string, { value: string; weight: number }[]>();
      for (const [id, { item, signals }] of eligible) {
        if (chosen.has(id)) continue;
        const entries = byCategory.get(item.category) ?? [];
        entries.push({ value: id, weight: itemWeight(signals, avoided.has(id)) });
        byCategory.set(item.category, entries);
      }
      for (const entries of byCategory.values()) {
        for (const id of weightedSample(entries, MAX_CANDIDATES_PER_CATEGORY)) chosen.add(id);
      }

      const candidates = [...chosen].map((id) => {
        const { item, signals } = eligible.get(id)!;
        return {
          id: item.id,
          category: item.category,
          subCategory: item.sub_category,
          brand: item.brand,
          description: item.description,
          metadata: item.metadata,
          notes: item.notes,
          pastOutfitNotes: notesByItemId.get(item.id) ?? [],
          signals,
        };
      });

      return { candidates, favoriteOutfits };
    },
  };
}
