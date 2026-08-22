import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface CandidateItem {
  id: string;
  category: string;
  subCategory: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  pastOutfitNotes: string[];
}

export interface CandidateGatheringService {
  /** Active (non-archived) items, excluding any in excludeItemIds, enriched with notes left on
   *  past outfits that included them. */
  gather(excludeItemIds: string[]): Promise<CandidateItem[]>;
}

interface ItemRow {
  id: string;
  category: string;
  sub_category: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  wear_history: string[] | null;
}

interface OutfitNotesRow {
  item_ids: string[] | null;
  notes: string | null;
}

// A large wardrobe (hundreds of items) sent whole would bloat the prompt to the point the model
// loses track of which real id corresponds to the outfit concept it settles on — observed in
// testing as a rationale describing a t-shirt/pants/jacket while the returned itemIds were
// unrelated shoes/bags. Capping per category keeps every category represented while bounding
// total prompt size, and biasing toward longest-unworn doubles as mild "rediscover" variety.
const MAX_CANDIDATES_PER_CATEGORY = 12;

function daysSinceWorn(wearHistory: string[] | null): number {
  if (!wearHistory || wearHistory.length === 0) return Number.POSITIVE_INFINITY;
  const last = new Date(wearHistory[wearHistory.length - 1]!);
  return (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
}

/** Uses the caller-scoped Supabase client passed in from the orchestrator — never a service-role
 *  client — so every read here stays governed by the caller's own RLS policies. */
export function createCandidateGatheringService(supabase: SupabaseClient): CandidateGatheringService {
  return {
    async gather(excludeItemIds: string[]): Promise<CandidateItem[]> {
      let itemsQuery = supabase
        .from('wardrobe_items')
        .select('id, category, sub_category, description, metadata, notes, wear_history')
        .is('archived_at', null);

      if (excludeItemIds.length > 0) {
        itemsQuery = itemsQuery.not('id', 'in', `(${excludeItemIds.join(',')})`);
      }

      const [{ data: items, error: itemsError }, { data: outfits, error: outfitsError }] =
        await Promise.all([
          itemsQuery.returns<ItemRow[]>(),
          supabase
            .from('outfits')
            .select('item_ids, notes')
            .not('notes', 'is', null)
            .returns<OutfitNotesRow[]>(),
        ]);

      if (itemsError) {
        throw new Error(`Failed to load candidate items: ${itemsError.message}`);
      }
      if (outfitsError) {
        throw new Error(`Failed to load outfit notes: ${outfitsError.message}`);
      }

      const notesByItemId = new Map<string, string[]>();
      for (const outfit of outfits ?? []) {
        if (!outfit.notes) continue;
        for (const itemId of outfit.item_ids ?? []) {
          const existing = notesByItemId.get(itemId);
          if (existing) {
            existing.push(outfit.notes);
          } else {
            notesByItemId.set(itemId, [outfit.notes]);
          }
        }
      }

      const byCategory = new Map<string, ItemRow[]>();
      for (const item of items ?? []) {
        const existing = byCategory.get(item.category);
        if (existing) {
          existing.push(item);
        } else {
          byCategory.set(item.category, [item]);
        }
      }

      const capped: ItemRow[] = [];
      for (const categoryItems of byCategory.values()) {
        categoryItems.sort((a, b) => daysSinceWorn(b.wear_history) - daysSinceWorn(a.wear_history));
        capped.push(...categoryItems.slice(0, MAX_CANDIDATES_PER_CATEGORY));
      }

      return capped.map((item) => ({
        id: item.id,
        category: item.category,
        subCategory: item.sub_category,
        description: item.description,
        metadata: item.metadata,
        notes: item.notes,
        pastOutfitNotes: notesByItemId.get(item.id) ?? [],
      }));
    },
  };
}
