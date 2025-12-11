// IndexedDB wrapper for wardrobe storage

import type { ItemCategory, ItemTrait, WardrobeItem } from "../types/wardrobe";
import type { Outfit } from "../types/outfit";

const DB_NAME = "MyWardrobeDB";
const DB_VERSION = 4; // Updated to match aiLearning.ts
const STORE_NAME = "items";
const OUTFITS_STORE = "outfits";
const FEEDBACK_STORE = "matchFeedback"; // Version 4+
const PREFERENCES_STORE = "userPreferences"; // Version 4+

// Open or create the database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      console.log(
        `Upgrading database from version ${oldVersion} to ${DB_VERSION}`
      );

      // Create items store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log("Creating items store");
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        objectStore.createIndex("category", "category", { unique: false });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create outfits store
      if (!db.objectStoreNames.contains(OUTFITS_STORE)) {
        console.log("Creating outfits store");
        const outfitsStore = db.createObjectStore(OUTFITS_STORE, {
          keyPath: "id",
        });
        outfitsStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // Create AI learning stores
      if (!db.objectStoreNames.contains(FEEDBACK_STORE)) {
        console.log("Creating matchFeedback store");
        const feedbackStore = db.createObjectStore(FEEDBACK_STORE, {
          keyPath: "id",
        });
        feedbackStore.createIndex("timestamp", "timestamp", { unique: false });
        feedbackStore.createIndex("suggestedItemId", "suggestedItemId", {
          unique: false,
        });
        feedbackStore.createIndex("userAction", "userAction", {
          unique: false,
        });
        feedbackStore.createIndex("outfitPhotoHash", "outfitPhotoHash", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(PREFERENCES_STORE)) {
        console.log("Creating userPreferences store");
        db.createObjectStore(PREFERENCES_STORE, { keyPath: "id" });
      }

      console.log("Database upgrade complete");
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

// Helper function to convert database item format to WardrobeItem
async function dbItemToWardrobeItem(dbItem: any): Promise<WardrobeItem> {
  return {
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
    trait: dbItem.trait as ItemTrait | undefined,
    purchaseDate: dbItem.purchaseDate
      ? new Date(dbItem.purchaseDate)
      : undefined,
    createdAt: new Date(dbItem.createdAt),
    updatedAt: new Date(dbItem.updatedAt),
    embedding: dbItem.embedding,
  };
}

// Save an item to IndexedDB
export async function saveItem(item: WardrobeItem): Promise<void> {
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
      trait: item.trait,
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
export async function loadAllItems(): Promise<Array<WardrobeItem>> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      const dbItems = request.result;

      // Convert database items to WardrobeItem format
      const items = await Promise.all(
        dbItems.map((dbItem) => dbItemToWardrobeItem(dbItem))
      );

      resolve(items);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Load a single item by ID from IndexedDB
export async function loadItemById(id: string): Promise<WardrobeItem | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = async () => {
      const dbItem = request.result;

      if (!dbItem) {
        resolve(null);
        return;
      }

      // Convert database item to WardrobeItem format
      const item = await dbItemToWardrobeItem(dbItem);
      resolve(item);
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

// Helper function to convert database outfit format to Outfit
async function dbOutfitToOutfit(dbOutfit: any): Promise<Outfit> {
  return {
    id: dbOutfit.id,
    photo: dbOutfit.photoBlob
      ? await blobToDataURL(dbOutfit.photoBlob)
      : undefined,
    itemIds: dbOutfit.itemIds,
    notes: dbOutfit.notes,
    rating: dbOutfit.rating,
    createdAt: new Date(dbOutfit.createdAt),
    updatedAt: new Date(dbOutfit.updatedAt),
  };
}

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
      rating: outfit.rating,
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

      // Convert database outfits to Outfit format
      const outfits = await Promise.all(
        dbOutfits.map((dbOutfit) => dbOutfitToOutfit(dbOutfit))
      );

      resolve(outfits);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// Load a single outfit by ID from IndexedDB
export async function loadOutfitById(id: string): Promise<Outfit | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OUTFITS_STORE], "readonly");
    const store = transaction.objectStore(OUTFITS_STORE);
    const request = store.get(id);

    request.onsuccess = async () => {
      const dbOutfit = request.result;

      if (!dbOutfit) {
        resolve(null);
        return;
      }

      // Convert database outfit to Outfit format
      const outfit = await dbOutfitToOutfit(dbOutfit);
      resolve(outfit);
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
