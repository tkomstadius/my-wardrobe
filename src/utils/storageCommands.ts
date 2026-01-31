import { compareAsc } from 'date-fns';
import type { NewOutfit, Outfit } from '../types/outfit';
import type { ItemCategory, WardrobeItem } from '../types/wardrobe';
import {
  deleteItem,
  deleteOutfit,
  loadAllItems,
  loadAllOutfits,
  loadItemById,
  loadItemsByCategory,
  loadOutfitById,
  saveItem,
  saveOutfit,
} from './indexedDB';

export function generateId(): string {
  // Generate a unique ID using timestamp + random string
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function saveItems(items: WardrobeItem[]): Promise<void> {
  try {
    await Promise.all(items.map((item) => saveItem(item)));
  } catch (error) {
    console.error('Failed to save items to IndexedDB:', error);
    throw new Error('Failed to save wardrobe items. Storage may be full.');
  }
}

export async function loadItems(): Promise<WardrobeItem[]> {
  try {
    return await loadAllItems();
  } catch (error) {
    console.error('Failed to load items from IndexedDB:', error);
    return [];
  }
}

export async function getItemById(id: string): Promise<WardrobeItem | null> {
  try {
    return await loadItemById(id);
  } catch (error) {
    console.error('Failed to load item by id from IndexedDB:', error);
    return null;
  }
}

export async function getItemsByIds(ids: string[]): Promise<WardrobeItem[]> {
  try {
    const items = await Promise.all(ids.map((id) => getItemById(id)));
    return items.filter((item): item is WardrobeItem => item !== null);
  } catch (error) {
    console.error('Failed to load items by ids from IndexedDB:', error);
    return [];
  }
}

export async function getItemsByCategory(category: ItemCategory): Promise<WardrobeItem[]> {
  try {
    return await loadItemsByCategory(category);
  } catch (error) {
    console.error('Failed to load items by category from IndexedDB:', error);
    return [];
  }
}

export async function removeItem(id: string): Promise<void> {
  try {
    await deleteItem(id);
  } catch (error) {
    console.error('Failed to delete item from IndexedDB:', error);
    throw new Error('Failed to delete item.');
  }
}

export async function incrementWearCount(itemId: string): Promise<number> {
  const item = await loadItemById(itemId);

  if (!item) {
    throw new Error('Item not found');
  }

  const now = new Date();
  const newWearHistory = [...(item.wearHistory || []), now];
  const initialCount = item.initialWearCount ?? 0;

  const updatedItem = {
    ...item,
    wearCount: initialCount + newWearHistory.length,
    wearHistory: newWearHistory,
    updatedAt: now,
  };

  await saveItem(updatedItem);

  return updatedItem.wearCount;
}

export async function logWearOnDate(itemId: string, date: Date): Promise<void> {
  const item = await loadItemById(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  const newWearHistory = [...(item.wearHistory || []), date].sort(compareAsc);
  const initialCount = item.initialWearCount ?? 0;

  const updatedItem = {
    ...item,
    wearCount: initialCount + newWearHistory.length,
    wearHistory: newWearHistory,
    updatedAt: new Date(),
  };

  await saveItem(updatedItem);
}

export async function removeWear(itemId: string, wearIndex: number): Promise<void> {
  const item = await loadItemById(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  if (wearIndex < 0 || wearIndex >= item.wearHistory?.length) {
    throw new Error('Invalid wear index');
  }
  const newWearHistory = [...(item.wearHistory || [])];
  newWearHistory.splice(wearIndex, 1);
  const initialCount = item.initialWearCount ?? 0;

  const updatedItem = {
    ...item,
    wearCount: initialCount + newWearHistory.length,
    wearHistory: newWearHistory,
    updatedAt: new Date(),
  };

  await saveItem(updatedItem);
}

export async function getAllBrands(): Promise<string[]> {
  try {
    const items = await loadItems();
    const brands = new Set<string>();
    for (const item of items) {
      if (item.brand?.trim()) {
        brands.add(item.brand.trim());
      }
    }
    return Array.from(brands).sort();
  } catch (error) {
    console.error('Failed to get all brands from IndexedDB:', error);
    return [];
  }
}

export async function updateItemEmbedding(id: string, embedding: number[]): Promise<void> {
  const item = await loadItemById(id);
  if (!item) {
    throw new Error('Item not found');
  }
  const updatedItem = {
    ...item,
    embedding,
    updatedAt: new Date(),
  };

  await saveItem(updatedItem);
}

// ========== Outfit Storage Functions ==========

export async function loadOutfits(): Promise<Outfit[]> {
  try {
    return await loadAllOutfits();
  } catch (error) {
    console.error('Failed to load outfits from IndexedDB:', error);
    return [];
  }
}

export async function getOutfitById(id: string): Promise<Outfit | null> {
  try {
    return await loadOutfitById(id);
  } catch (error) {
    console.error('Failed to load outfit by id from IndexedDB:', error);
    return null;
  }
}

export async function getOutfitsWithItemId(itemId: string): Promise<Outfit[]> {
  try {
    const allOutfits = await loadAllOutfits();
    return allOutfits.filter((outfit) => outfit.itemIds.includes(itemId));
  } catch (error) {
    console.error('Failed to load outfits with item from IndexedDB:', error);
    return [];
  }
}

export async function removeOutfit(id: string): Promise<void> {
  try {
    await deleteOutfit(id);
  } catch (error) {
    console.error('Failed to delete outfit from IndexedDB:', error);
    throw new Error('Failed to delete outfit.');
  }
}

export async function addOutfit(outfit: NewOutfit): Promise<void> {
  try {
    await saveOutfit({ ...outfit, id: generateId(), updatedAt: new Date() });
  } catch (error) {
    console.error('Failed to save outfit to IndexedDB:', error);
    throw new Error('Failed to save outfit. Storage may be full.');
  }
}

export async function updateOutfit(id: string, updates: Partial<Outfit>): Promise<void> {
  const outfit = await getOutfitById(id);

  if (!outfit) {
    throw new Error('Outfit not found');
  }

  const updatedOutfit = {
    ...outfit,
    ...updates,
    updatedAt: new Date(),
  };

  await saveOutfit(updatedOutfit);
}
