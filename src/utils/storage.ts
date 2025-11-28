import type { WardrobeItem } from '../types/wardrobe';
import { deleteItem, loadAllItems, saveItem } from './indexedDB';

// Storage layer - now uses IndexedDB for better capacity and performance
// Previously used localStorage (5-10MB limit)
// IndexedDB provides 50MB+ storage and stores images as Blobs (more efficient)

export async function saveItems(items: WardrobeItem[]): Promise<void> {
  try {
    // Save all items to IndexedDB
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

export async function removeItem(id: string): Promise<void> {
  try {
    await deleteItem(id);
  } catch (error) {
    console.error('Failed to delete item from IndexedDB:', error);
    throw new Error('Failed to delete item.');
  }
}

export function generateId(): string {
  // Generate a unique ID using timestamp + random string
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
