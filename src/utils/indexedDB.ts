// IndexedDB wrapper for wardrobe storage
// More capacity than localStorage, stores images as Blobs for efficiency

import type { ItemCategory } from "../types/wardrobe";
import type { Outfit } from "../types/outfit";

const DB_NAME = "MyWardrobeDB";
const DB_VERSION = 3;
const STORE_NAME = "items";
const OUTFITS_STORE = "outfits";

// Open or create the database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;

      // Check if outfits store exists, if not, we need to upgrade
      if (!db.objectStoreNames.contains(OUTFITS_STORE)) {
        db.close();
        // Force upgrade by incrementing version
        const upgradeRequest = indexedDB.open(DB_NAME, db.version + 1);
        upgradeRequest.onerror = () => reject(upgradeRequest.error);
        upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
        upgradeRequest.onupgradeneeded = (event) => {
          const upgradedDb = (event.target as IDBOpenDBRequest).result;
          if (!upgradedDb.objectStoreNames.contains(OUTFITS_STORE)) {
            const outfitsStore = upgradedDb.createObjectStore(OUTFITS_STORE, {
              keyPath: "id",
            });
            outfitsStore.createIndex("createdAt", "createdAt", {
              unique: false,
            });
          }
        };
      } else {
        resolve(db);
      }
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist (initial setup)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("category", "category", { unique: false });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create outfits store (version 3+)
      if (!db.objectStoreNames.contains(OUTFITS_STORE)) {
        const outfitsStore = db.createObjectStore(OUTFITS_STORE, {
          keyPath: "id",
        });
        outfitsStore.createIndex("createdAt", "createdAt", { unique: false });
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
  notes?: string;
  brand?: string;
  category: ItemCategory;
  wearCount: number;
  initialWearCount?: number;
  wearHistory: Date[];
  price?: number;
  isSecondHand?: boolean;
  isDogCasual?: boolean;
  isHandmade?: boolean;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  embedding?: number[];
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
      notes: item.notes,
      brand: item.brand,
      category: item.category,
      wearCount: item.wearCount,
      initialWearCount: item.initialWearCount,
      wearHistory: item.wearHistory.map((date) => date.toISOString()),
      price: item.price,
      isSecondHand: item.isSecondHand,
      isDogCasual: item.isDogCasual,
      isHandmade: item.isHandmade,
      purchaseDate: item.purchaseDate?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      embedding: item.embedding,
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
    notes?: string;
    brand?: string;
    category: ItemCategory;
    wearCount: number;
    initialWearCount?: number;
    wearHistory: Date[];
    price?: number;
    isSecondHand?: boolean;
    isDogCasual?: boolean;
    isHandmade?: boolean;
    purchaseDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    embedding?: number[];
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
          notes: dbItem.notes,
          brand: dbItem.brand,
          category: dbItem.category as ItemCategory,
          wearCount: dbItem.wearCount,
          initialWearCount: dbItem.initialWearCount,
          wearHistory: dbItem.wearHistory
            ? dbItem.wearHistory.map((dateStr: string) => new Date(dateStr))
            : [],
          price: dbItem.price,
          isSecondHand: dbItem.isSecondHand,
          isDogCasual: dbItem.isDogCasual,
          isHandmade: dbItem.isHandmade,
          purchaseDate: dbItem.purchaseDate
            ? new Date(dbItem.purchaseDate)
            : undefined,
          createdAt: new Date(dbItem.createdAt),
          updatedAt: new Date(dbItem.updatedAt),
          embedding: dbItem.embedding,
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

// ========== Outfit Storage Functions ==========

// Save an outfit to IndexedDB
export async function saveOutfit(outfit: Outfit): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OUTFITS_STORE], "readwrite");
    const store = transaction.objectStore(OUTFITS_STORE);

    // Convert photo data URL to Blob if it exists
    const dbOutfit = {
      id: outfit.id,
      photoBlob: outfit.photo ? dataURLtoBlob(outfit.photo) : undefined,
      itemIds: outfit.itemIds,
      notes: outfit.notes,
      comfortRating: outfit.comfortRating,
      confidenceRating: outfit.confidenceRating,
      creativityRating: outfit.creativityRating,
      createdAt: outfit.createdAt.toISOString(),
      updatedAt: outfit.updatedAt.toISOString(),
    };

    const request = store.put(dbOutfit);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Load all outfits from IndexedDB
export async function loadAllOutfits(): Promise<Outfit[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OUTFITS_STORE], "readonly");
    const store = transaction.objectStore(OUTFITS_STORE);
    const request = store.getAll();

    request.onsuccess = async () => {
      const dbOutfits = request.result;

      // Convert Blobs back to data URLs
      const outfits = await Promise.all(
        dbOutfits.map(async (dbOutfit) => ({
          id: dbOutfit.id,
          photo: dbOutfit.photoBlob
            ? await blobToDataURL(dbOutfit.photoBlob)
            : undefined,
          itemIds: dbOutfit.itemIds,
          notes: dbOutfit.notes,
          comfortRating: dbOutfit.comfortRating,
          confidenceRating: dbOutfit.confidenceRating,
          creativityRating: dbOutfit.creativityRating,
          createdAt: new Date(dbOutfit.createdAt),
          updatedAt: new Date(dbOutfit.updatedAt),
        }))
      );

      resolve(outfits);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Delete an outfit from IndexedDB
export async function deleteOutfit(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OUTFITS_STORE], "readwrite");
    const store = transaction.objectStore(OUTFITS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Delete entire database (useful for development/debugging)
export async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log("Database deleted successfully");
      resolve();
    };

    request.onerror = () => {
      console.error("Error deleting database:", request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn(
        "Database deletion blocked. Close all tabs using this database."
      );
    };
  });
}
