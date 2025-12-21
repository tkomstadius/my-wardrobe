import type { ItemCategory, WardrobeItem } from "../types/wardrobe";
import type { Outfit } from "../types/outfit";
import {
  deleteItem,
  loadAllItems,
  saveItem,
  saveOutfit,
  loadAllOutfits,
  deleteOutfit,
  loadItemsByCategory,
} from "./indexedDB";

export async function saveItems(items: WardrobeItem[]): Promise<void> {
  try {
    await Promise.all(items.map((item) => saveItem(item)));
  } catch (error) {
    console.error("Failed to save items to IndexedDB:", error);
    throw new Error("Failed to save wardrobe items. Storage may be full.");
  }
}

export async function loadItems(): Promise<WardrobeItem[]> {
  try {
    return await loadAllItems();
  } catch (error) {
    console.error("Failed to load items from IndexedDB:", error);
    return [];
  }
}

export async function getItemsByCategory(
  category: ItemCategory
): Promise<WardrobeItem[]> {
  try {
    return await loadItemsByCategory(category);
  } catch (error) {
    console.error("Failed to load items by category from IndexedDB:", error);
    return [];
  }
}

export async function removeItem(id: string): Promise<void> {
  try {
    await deleteItem(id);
  } catch (error) {
    console.error("Failed to delete item from IndexedDB:", error);
    throw new Error("Failed to delete item.");
  }
}

export function generateId(): string {
  // Generate a unique ID using timestamp + random string
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ========== Outfit Storage Functions ==========

export async function loadOutfits(): Promise<Outfit[]> {
  try {
    return await loadAllOutfits();
  } catch (error) {
    console.error("Failed to load outfits from IndexedDB:", error);
    return [];
  }
}

export async function getOutfitsWithItemId(itemId: string): Promise<Outfit[]> {
  try {
    const allOutfits = await loadAllOutfits();
    return allOutfits.filter((outfit) => outfit.itemIds.includes(itemId));
  } catch (error) {
    console.error("Failed to load outfits with item from IndexedDB:", error);
    return [];
  }
}

export async function removeOutfit(id: string): Promise<void> {
  try {
    await deleteOutfit(id);
  } catch (error) {
    console.error("Failed to delete outfit from IndexedDB:", error);
    throw new Error("Failed to delete outfit.");
  }
}

export async function saveOutfitToStorage(outfit: Outfit): Promise<void> {
  try {
    await saveOutfit(outfit);
  } catch (error) {
    console.error("Failed to save outfit to IndexedDB:", error);
    throw new Error("Failed to save outfit. Storage may be full.");
  }
}
