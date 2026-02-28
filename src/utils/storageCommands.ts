import { compareAsc } from 'date-fns';
import type { NewOutfit, Outfit, OutfitRating } from '../types/outfit';
import type { ArchiveReason, ItemCategory, WardrobeItem } from '../types/wardrobe';
import { getCurrentUserId, supabase } from './supabase';
import { deleteImage, getSignedUrl, getSignedUrls } from './supabaseStorage';

// ========== Helpers ==========

// All wardrobe_items columns except the 512-dim embedding vector.
// Embedding is large (~2KB/item) and only needed for AI features.
const ITEM_COLUMNS =
  'id, image_url, notes, brand, category, sub_category, wear_count, initial_wear_count, wear_history, price, is_second_hand, is_dog_casual, is_handmade, rating, purchase_date, created_at, updated_at, user_id, archived_at, archive_reason, archive_notes';
const ITEM_COLUMNS_WITH_EMBEDDING = `${ITEM_COLUMNS}, embedding`;

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** Map a Supabase wardrobe_items row (snake_case) to a WardrobeItem (camelCase). */
function mapRowToItem(row: Record<string, unknown>): WardrobeItem {
  return {
    id: row.id as string,
    imageUrl: row.image_url as string, // storage path — caller resolves to signed URL
    notes: (row.notes as string) ?? undefined,
    brand: (row.brand as string) ?? undefined,
    category: row.category as ItemCategory,
    subCategory: (row.sub_category as string) ?? undefined,
    wearCount: (row.wear_count as number) ?? 0,
    initialWearCount: (row.initial_wear_count as number) ?? undefined,
    wearHistory: Array.isArray(row.wear_history)
      ? (row.wear_history as string[]).map((d) => new Date(d))
      : [],
    price: row.price != null ? Number(row.price) : undefined,
    isSecondHand: (row.is_second_hand as boolean) ?? undefined,
    isDogCasual: (row.is_dog_casual as boolean) ?? undefined,
    isHandmade: (row.is_handmade as boolean) ?? undefined,
    rating: validateRating(row.rating as number | null),
    purchaseDate: row.purchase_date ? new Date(row.purchase_date as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    embedding: (row.embedding as number[]) ?? undefined,
    archivedAt: row.archived_at ? new Date(row.archived_at as string) : undefined,
    archiveReason: (row.archive_reason as ArchiveReason) ?? undefined,
    archiveNotes: (row.archive_notes as string) ?? undefined,
  };
}

/** Map a Supabase outfits row (snake_case) to an Outfit (camelCase). */
function mapRowToOutfit(row: Record<string, unknown>): Outfit {
  return {
    id: row.id as string,
    photo: (row.photo_url as string) ?? undefined, // storage path — caller resolves to signed URL
    itemIds: Array.isArray(row.item_ids) ? (row.item_ids as string[]) : [],
    notes: (row.notes as string) ?? undefined,
    rating: validateRating(row.rating as number | null),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function validateRating(value: number | null | undefined): OutfitRating | undefined {
  if (value === 1 || value === 0 || value === -1) {
    return value;
  }
  return undefined;
}

/**
 * Resolve storage paths to signed URLs for a list of items.
 * Mutates imageUrl in-place from storage path to signed URL.
 */
async function resolveItemImageUrls(items: WardrobeItem[]): Promise<WardrobeItem[]> {
  const paths = items.map((item) => item.imageUrl).filter(Boolean);
  if (paths.length === 0) return items;

  const urlMap = await getSignedUrls(paths);
  return items.map((item) => ({
    ...item,
    imageUrl: urlMap.get(item.imageUrl) ?? item.imageUrl,
  }));
}

/**
 * Resolve storage paths to signed URLs for a list of outfits.
 */
async function resolveOutfitPhotoUrls(outfits: Outfit[]): Promise<Outfit[]> {
  const paths = outfits.map((o) => o.photo).filter((p): p is string => !!p);
  if (paths.length === 0) return outfits;

  const urlMap = await getSignedUrls(paths);
  return outfits.map((outfit) => ({
    ...outfit,
    photo: outfit.photo ? (urlMap.get(outfit.photo) ?? outfit.photo) : undefined,
  }));
}

// ========== Item Storage Functions ==========

export async function saveItems(items: WardrobeItem[]): Promise<void> {
  const userId = await getCurrentUserId();
  const rows = items.map((item) => ({
    id: item.id,
    image_url: item.imageUrl,
    notes: item.notes ?? null,
    brand: item.brand ?? null,
    category: item.category,
    sub_category: item.subCategory ?? null,
    wear_count: item.wearCount,
    initial_wear_count: item.initialWearCount ?? 0,
    wear_history: item.wearHistory.map((d) => d.toISOString()),
    price: item.price?.toString() ?? null,
    is_second_hand: item.isSecondHand ?? false,
    is_dog_casual: item.isDogCasual ?? false,
    is_handmade: item.isHandmade ?? false,
    rating: item.rating ?? null,
    purchase_date: item.purchaseDate?.toISOString() ?? null,
    // Only include embedding if explicitly set — omitting it preserves the existing DB value on upsert
    ...(item.embedding !== undefined && { embedding: item.embedding }),
    archived_at: item.archivedAt?.toISOString() ?? null,
    archive_reason: item.archiveReason ?? null,
    archive_notes: item.archiveNotes ?? null,
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
    user_id: userId,
  }));

  const { error } = await supabase.from('wardrobe_items').upsert(rows);
  if (error) {
    console.error('Failed to save items:', error);
    throw new Error('Failed to save wardrobe items.');
  }
}

export async function saveItem(item: WardrobeItem): Promise<void> {
  await saveItems([item]);
}

export async function loadItems(): Promise<WardrobeItem[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(ITEM_COLUMNS)
      .eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];

    const items = data.map(mapRowToItem);
    return resolveItemImageUrls(items);
  } catch (error) {
    console.error('Failed to load items:', error);
    return [];
  }
}

export async function loadItemsWithEmbeddings(): Promise<WardrobeItem[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(ITEM_COLUMNS_WITH_EMBEDDING)
      .eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];

    const items = data.map(mapRowToItem);
    return resolveItemImageUrls(items);
  } catch (error) {
    console.error('Failed to load items with embeddings:', error);
    return [];
  }
}

export async function getItemById(id: string): Promise<WardrobeItem | null> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(ITEM_COLUMNS)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const item = mapRowToItem(data);
    const signedUrl = await getSignedUrl(item.imageUrl);
    return { ...item, imageUrl: signedUrl };
  } catch (error) {
    console.error('Failed to load item by id:', error);
    return null;
  }
}

export async function getItemsByIds(ids: string[]): Promise<WardrobeItem[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(ITEM_COLUMNS)
      .eq('user_id', userId)
      .in('id', ids);

    if (error) throw error;
    if (!data) return [];

    const items = data.map(mapRowToItem);
    return resolveItemImageUrls(items);
  } catch (error) {
    console.error('Failed to load items by ids:', error);
    return [];
  }
}

export async function getItemsByCategory(category: ItemCategory): Promise<WardrobeItem[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(ITEM_COLUMNS)
      .eq('user_id', userId)
      .eq('category', category);

    if (error) throw error;
    if (!data) return [];

    const items = data.map(mapRowToItem);
    return resolveItemImageUrls(items);
  } catch (error) {
    console.error('Failed to load items by category:', error);
    return [];
  }
}

export async function removeItem(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    // Get the item first to find its image path
    const { data } = await supabase
      .from('wardrobe_items')
      .select('image_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    // Delete the DB record
    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Delete the image from Storage
    if (data?.image_url) {
      try {
        await deleteImage(data.image_url as string);
      } catch (imgError) {
        console.warn('Failed to delete item image from storage:', imgError);
      }
    }
  } catch (error) {
    console.error('Failed to delete item:', error);
    throw new Error('Failed to delete item.');
  }
}

export async function archiveItem(
  id: string,
  reason: ArchiveReason,
  notes?: string,
): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      archived_at: new Date().toISOString(),
      archive_reason: reason,
      archive_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to archive item.');
  }
}

export async function unarchiveItem(id: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      archived_at: null,
      archive_reason: null,
      archive_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to unarchive item.');
  }
}

export async function loadArchivedItems(): Promise<WardrobeItem[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select(ITEM_COLUMNS)
      .eq('user_id', userId)
      .not('archived_at', 'is', null);

    if (error) throw error;
    if (!data) return [];

    const items = data.map(mapRowToItem);
    return resolveItemImageUrls(items);
  } catch (error) {
    console.error('Failed to load archived items:', error);
    return [];
  }
}

export async function incrementWearCount(itemId: string): Promise<number> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('wear_count, initial_wear_count, wear_history')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Item not found');
  }

  const now = new Date();
  const currentHistory = Array.isArray(data.wear_history) ? (data.wear_history as string[]) : [];
  const newHistory = [...currentHistory, now.toISOString()];
  const initialCount = (data.initial_wear_count as number) ?? 0;
  const newWearCount = initialCount + newHistory.length;

  const { error: updateError } = await supabase
    .from('wardrobe_items')
    .update({
      wear_count: newWearCount,
      wear_history: newHistory,
      updated_at: now.toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error('Failed to update wear count');
  }

  return newWearCount;
}

export async function logWearOnDate(itemId: string, date: Date): Promise<void> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('initial_wear_count, wear_history')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Item not found');
  }

  const currentHistory = Array.isArray(data.wear_history)
    ? (data.wear_history as string[]).map((d) => new Date(d))
    : [];
  const newHistory = [...currentHistory, date].sort(compareAsc);
  const initialCount = (data.initial_wear_count as number) ?? 0;

  const { error: updateError } = await supabase
    .from('wardrobe_items')
    .update({
      wear_count: initialCount + newHistory.length,
      wear_history: newHistory.map((d) => d.toISOString()),
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error('Failed to log wear');
  }
}

export async function removeWear(itemId: string, wearIndex: number): Promise<void> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('initial_wear_count, wear_history')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Item not found');
  }

  const currentHistory = Array.isArray(data.wear_history)
    ? [...(data.wear_history as string[])]
    : [];

  if (wearIndex < 0 || wearIndex >= currentHistory.length) {
    throw new Error('Invalid wear index');
  }

  currentHistory.splice(wearIndex, 1);
  const initialCount = (data.initial_wear_count as number) ?? 0;

  const { error: updateError } = await supabase
    .from('wardrobe_items')
    .update({
      wear_count: initialCount + currentHistory.length,
      wear_history: currentHistory,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error('Failed to remove wear');
  }
}

export async function getAllBrands(): Promise<string[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('brand')
      .eq('user_id', userId)
      .not('brand', 'is', null);

    if (error) throw error;
    if (!data) return [];

    const brands = new Set<string>();
    for (const row of data) {
      const brand = row.brand as string | null;
      if (brand?.trim()) {
        brands.add(brand.trim());
      }
    }
    return Array.from(brands).sort();
  } catch (error) {
    console.error('Failed to get all brands:', error);
    return [];
  }
}

export async function updateItemEmbedding(id: string, embedding: number[]): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      embedding,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to update item embedding');
  }
}

/**
 * Get the raw storage path for an item's image (not the signed URL).
 * Used when the image hasn't changed and we need to preserve the existing path.
 */
export async function getItemStoragePath(id: string): Promise<string | null> {
  const userId = await getCurrentUserId();
  const { data } = await supabase
    .from('wardrobe_items')
    .select('image_url')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  return (data?.image_url as string) ?? null;
}

// ========== Outfit Storage Functions ==========

export async function loadOutfits(): Promise<Outfit[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase.from('outfits').select('*').eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];

    const outfits = data.map(mapRowToOutfit);
    return resolveOutfitPhotoUrls(outfits);
  } catch (error) {
    console.error('Failed to load outfits:', error);
    return [];
  }
}

export async function getOutfitById(id: string): Promise<Outfit | null> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    const outfit = mapRowToOutfit(data);
    if (outfit.photo) {
      const signedUrl = await getSignedUrl(outfit.photo);
      return { ...outfit, photo: signedUrl };
    }
    return outfit;
  } catch (error) {
    console.error('Failed to load outfit by id:', error);
    return null;
  }
}

export async function getOutfitsWithItemId(itemId: string): Promise<Outfit[]> {
  try {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', userId)
      .contains('item_ids', [itemId]);

    if (error) throw error;
    if (!data) return [];

    const outfits = data.map(mapRowToOutfit);
    return resolveOutfitPhotoUrls(outfits);
  } catch (error) {
    console.error('Failed to load outfits with item:', error);
    return [];
  }
}

export async function removeOutfit(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    // Get the outfit first to find its photo path
    const { data } = await supabase
      .from('outfits')
      .select('photo_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    // Delete the DB record
    const { error } = await supabase.from('outfits').delete().eq('id', id).eq('user_id', userId);

    if (error) throw error;

    // Delete the photo from Storage
    if (data?.photo_url) {
      try {
        await deleteImage(data.photo_url as string);
      } catch (imgError) {
        console.warn('Failed to delete outfit photo from storage:', imgError);
      }
    }
  } catch (error) {
    console.error('Failed to delete outfit:', error);
    throw new Error('Failed to delete outfit.');
  }
}

export async function addOutfit(outfit: NewOutfit): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    const now = new Date();
    const id = generateId();

    const { error } = await supabase.from('outfits').insert({
      id,
      photo_url: outfit.photo ?? null,
      item_ids: outfit.itemIds,
      notes: outfit.notes ?? null,
      rating: outfit.rating ?? null,
      created_at: (outfit.createdAt ?? now).toISOString(),
      updated_at: now.toISOString(),
      user_id: userId,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save outfit:', error);
    throw new Error('Failed to save outfit.');
  }
}

export async function saveOutfits(outfits: Outfit[]): Promise<void> {
  const userId = await getCurrentUserId();
  const rows = outfits.map((outfit) => ({
    id: outfit.id,
    photo_url: outfit.photo ?? null,
    item_ids: outfit.itemIds,
    notes: outfit.notes ?? null,
    rating: outfit.rating ?? null,
    created_at: outfit.createdAt.toISOString(),
    updated_at: outfit.updatedAt.toISOString(),
    user_id: userId,
  }));

  const { error } = await supabase.from('outfits').upsert(rows);
  if (error) {
    console.error('Failed to save outfits:', error);
    throw new Error('Failed to save outfits.');
  }
}

export async function saveOutfit(outfit: Outfit): Promise<void> {
  await saveOutfits([outfit]);
}

export async function updateOutfit(id: string, updates: Partial<Outfit>): Promise<void> {
  const userId = await getCurrentUserId();

  const updateRow: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.photo !== undefined) updateRow.photo_url = updates.photo;
  if (updates.itemIds !== undefined) updateRow.item_ids = updates.itemIds;
  if (updates.notes !== undefined) updateRow.notes = updates.notes;
  if (updates.rating !== undefined) updateRow.rating = updates.rating;

  const { error } = await supabase
    .from('outfits')
    .update(updateRow)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to update outfit');
  }
}
