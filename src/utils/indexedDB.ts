// IndexedDB wrapper for wardrobe storage
// More capacity than localStorage, stores images as Blobs for efficiency

import type { ItemCategory } from "../types/wardrobe";

const DB_NAME = "MyWardrobeDB";
const DB_VERSION = 1;
const STORE_NAME = "items";

// Open or create the database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("category", "category", { unique: false });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
  });
}

// Convert data URL to Blob for efficient storage
export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1] ?? "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

// Convert Blob to data URL for display
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Save an item to IndexedDB
export async function saveItem(item: {
  id: string;
  imageUrl: string;
  type: string;
  color: string;
  brand?: string;
  category: ItemCategory;
  wearCount: number;
  createdAt: Date;
  updatedAt: Date;
}): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Convert image data URL to Blob for efficient storage
    const imageBlob = dataURLtoBlob(item.imageUrl);

    const dbItem = {
      id: item.id,
      imageBlob,
      type: item.type,
      color: item.color,
      brand: item.brand,
      category: item.category,
      wearCount: item.wearCount,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };

    const request = store.put(dbItem);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Load all items from IndexedDB
export async function loadAllItems(): Promise<
  Array<{
    id: string;
    imageUrl: string;
    type: string;
    color: string;
    brand?: string;
    category: ItemCategory;
    wearCount: number;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      const dbItems = request.result;

      // Convert Blobs back to data URLs
      const items = await Promise.all(
        dbItems.map(async (dbItem) => ({
          id: dbItem.id,
          imageUrl: await blobToDataURL(dbItem.imageBlob),
          type: dbItem.type,
          color: dbItem.color,
          brand: dbItem.brand,
          category: dbItem.category as ItemCategory,
          wearCount: dbItem.wearCount,
          createdAt: new Date(dbItem.createdAt),
          updatedAt: new Date(dbItem.updatedAt),
        }))
      );

      resolve(items);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Delete an item from IndexedDB
export async function deleteItem(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Clear all items (for testing/reset)
export async function clearAllItems(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Get storage usage estimate (if supported)
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  usageInMB: number;
  quotaInMB: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      usageInMB: Math.round((estimate.usage || 0) / 1024 / 1024),
      quotaInMB: Math.round((estimate.quota || 0) / 1024 / 1024),
    };
  }

  return { usage: 0, quota: 0, usageInMB: 0, quotaInMB: 0 };
}
