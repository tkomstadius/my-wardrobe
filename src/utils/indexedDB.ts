// IndexedDB wrapper for wardrobe storage

import { openDB, type IDBPDatabase } from "idb";
import type { ItemCategory, WardrobeItem } from "../types/wardrobe";
import type { Outfit, OutfitRating } from "../types/outfit";

const DB_NAME = "MyWardrobeDB";
const DB_VERSION = 4; // Updated to match aiLearning.ts
const STORE_NAME = "items";
const OUTFITS_STORE = "outfits";
const FEEDBACK_STORE = "matchFeedback"; // Version 4+
const PREFERENCES_STORE = "userPreferences"; // Version 4+

// Database schema type
interface DBSchema {
  items: {
    key: string;
    value: DBItem;
    indexes: { category: string; createdAt: string };
  };
  outfits: {
    key: string;
    value: DBOutfit;
    indexes: { createdAt: string };
  };
  matchFeedback: {
    key: string;
    value: any;
    indexes: {
      timestamp: string;
      suggestedItemId: string;
      userAction: string;
      outfitPhotoHash: string;
    };
  };
  userPreferences: {
    key: string;
    value: any;
  };
}

// Open or create the database
function getDB(): Promise<IDBPDatabase<DBSchema>> {
  return openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
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
    },
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

// Type for items as stored in IndexedDB (with Blob instead of data URL)
interface DBItem {
  id: string;
  imageBlob: Blob;
  notes?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  wearCount: number;
  initialWearCount?: number;
  wearHistory?: string[]; // Stored as ISO strings
  price?: number;
  isSecondHand?: boolean;
  isDogCasual?: boolean;
  isHandmade?: boolean;
  rating?: number; // 1 = good, 0 = meh, -1 = nope
  purchaseDate?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  embedding?: number[];
}

// Type for outfits as stored in IndexedDB (with Blob instead of data URL)
interface DBOutfit {
  id: string;
  photoBlob?: Blob;
  itemIds: string[];
  notes?: string;
  rating?: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Helper function to convert database item format to WardrobeItem
async function dbItemToWardrobeItem(dbItem: DBItem): Promise<WardrobeItem> {
  return {
    id: dbItem.id,
    imageUrl: await blobToDataURL(dbItem.imageBlob),
    notes: dbItem.notes,
    brand: dbItem.brand,
    category: dbItem.category as ItemCategory,
    subCategory: dbItem.subCategory,
    wearCount: dbItem.wearCount,
    initialWearCount: dbItem.initialWearCount,
    wearHistory: dbItem.wearHistory
      ? dbItem.wearHistory.map((dateStr: string) => new Date(dateStr))
      : [],
    price: dbItem.price,
    isSecondHand: dbItem.isSecondHand,
    isDogCasual: dbItem.isDogCasual,
    isHandmade: dbItem.isHandmade,
    rating:
      dbItem.rating === 1 || dbItem.rating === 0 || dbItem.rating === -1
        ? dbItem.rating
        : undefined,
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
  const db = await getDB();

  // Convert image data URL to Blob for efficient storage
  const imageBlob = dataURLtoBlob(item.imageUrl);

  const dbItem: DBItem = {
    id: item.id,
    imageBlob,
    notes: item.notes,
    brand: item.brand,
    category: item.category,
    subCategory: item.subCategory,
    wearCount: item.wearCount,
    initialWearCount: item.initialWearCount,
    wearHistory: item.wearHistory.map((date) => date.toISOString()),
    price: item.price,
    isSecondHand: item.isSecondHand,
    isDogCasual: item.isDogCasual,
    isHandmade: item.isHandmade,
    rating: item.rating,
    purchaseDate: item.purchaseDate?.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    embedding: item.embedding,
  };

  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.put(dbItem);
  await tx.done;
}

// Load all items from IndexedDB
export async function loadAllItems(): Promise<Array<WardrobeItem>> {
  const db = await getDB();

  const tx = db.transaction(STORE_NAME, "readonly");
  const dbItems = await tx.store.getAll();

  // Convert database items to WardrobeItem format
  const items = await Promise.all(
    dbItems.map((dbItem) => dbItemToWardrobeItem(dbItem))
  );

  // Clean up old trait data: if dbItem has trait field (from old data), remove it
  const itemsToClean = dbItems.filter(
    (dbItem) => "trait" in dbItem && dbItem.trait !== undefined
  );

  // Save cleaned items back to database (without trait)
  if (itemsToClean.length > 0) {
    const cleanedItems = await Promise.all(
      itemsToClean.map(async (dbItem) => {
        const item = await dbItemToWardrobeItem(dbItem);
        return {
          ...item,
          updatedAt: new Date(),
        };
      })
    );

    await Promise.all(cleanedItems.map((item) => saveItem(item)));
  }

  return items;
}

// Load a single item by ID from IndexedDB
export async function loadItemById(id: string): Promise<WardrobeItem | null> {
  const db = await getDB();

  const tx = db.transaction(STORE_NAME, "readonly");
  const dbItem = await tx.store.get(id);

  if (!dbItem) {
    return null;
  }

  const item = await dbItemToWardrobeItem(dbItem);

  // Clean up old trait data: if dbItem has trait field (from old data), remove it
  if ("trait" in dbItem && dbItem.trait !== undefined) {
    const cleanedItem = {
      ...item,
      updatedAt: new Date(),
    };
    // Save cleaned item back to database (without trait)
    await saveItem(cleanedItem);
    return cleanedItem;
  }

  return item;
}

export async function loadItemsByCategory(
  category: ItemCategory
): Promise<WardrobeItem[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const dbItems = await tx.store.index("category").getAll(category);

  return Promise.all(dbItems.map((dbItem) => dbItemToWardrobeItem(dbItem)));
}

// Delete an item from IndexedDB
export async function deleteItem(id: string): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.delete(id);
  await tx.done;
}

// Clear all items (for testing/reset)
export async function clearAllItems(): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.clear();
  await tx.done;
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
async function dbOutfitToOutfit(dbOutfit: DBOutfit): Promise<Outfit> {
  // Validate rating is a valid OutfitRating (1, 0, or -1)
  const rating: OutfitRating | undefined =
    dbOutfit.rating === 1 || dbOutfit.rating === 0 || dbOutfit.rating === -1
      ? dbOutfit.rating
      : undefined;

  return {
    id: dbOutfit.id,
    photo: dbOutfit.photoBlob
      ? await blobToDataURL(dbOutfit.photoBlob)
      : undefined,
    itemIds: dbOutfit.itemIds,
    notes: dbOutfit.notes,
    rating,
    createdAt: new Date(dbOutfit.createdAt),
    updatedAt: new Date(dbOutfit.updatedAt),
  };
}

// Save an outfit to IndexedDB
export async function saveOutfit(outfit: Outfit): Promise<void> {
  const db = await getDB();

  // Convert photo data URL to Blob if it exists
  const dbOutfit: DBOutfit = {
    id: outfit.id,
    photoBlob: outfit.photo ? dataURLtoBlob(outfit.photo) : undefined,
    itemIds: outfit.itemIds,
    notes: outfit.notes,
    rating: outfit.rating,
    createdAt: outfit.createdAt.toISOString(),
    updatedAt: outfit.updatedAt.toISOString(),
  };

  const tx = db.transaction(OUTFITS_STORE, "readwrite");
  await tx.store.put(dbOutfit);
  await tx.done;
}

// Load all outfits from IndexedDB
export async function loadAllOutfits(): Promise<Outfit[]> {
  const db = await getDB();

  const tx = db.transaction(OUTFITS_STORE, "readonly");
  const dbOutfits = await tx.store.getAll();

  // Convert database outfits to Outfit format
  const outfits = await Promise.all(
    dbOutfits.map((dbOutfit) => dbOutfitToOutfit(dbOutfit))
  );

  // Clean up invalid ratings: if rating exists but is not 1, 0, or -1, remove it
  const outfitsToClean = outfits.filter(
    (outfit) =>
      outfit.rating !== undefined &&
      outfit.rating !== 1 &&
      outfit.rating !== 0 &&
      outfit.rating !== -1
  );

  // Save cleaned outfits back to database (without invalid ratings)
  if (outfitsToClean.length > 0) {
    const cleanedOutfits = outfitsToClean.map((outfit) => ({
      ...outfit,
      rating: undefined,
      updatedAt: new Date(),
    }));

    await Promise.all(cleanedOutfits.map((outfit) => saveOutfit(outfit)));

    // Update the outfits array with cleaned ratings
    return outfits.map((outfit) => {
      const needsCleaning =
        outfit.rating !== undefined &&
        outfit.rating !== 1 &&
        outfit.rating !== 0 &&
        outfit.rating !== -1;
      return needsCleaning ? { ...outfit, rating: undefined } : outfit;
    });
  }

  return outfits;
}

// Load a single outfit by ID from IndexedDB
export async function loadOutfitById(id: string): Promise<Outfit | null> {
  const db = await getDB();

  const tx = db.transaction(OUTFITS_STORE, "readonly");
  const dbOutfit = await tx.store.get(id);

  if (!dbOutfit) {
    return null;
  }

  const outfit = await dbOutfitToOutfit(dbOutfit);

  // Clean up invalid rating: if rating exists but is not 1, 0, or -1, remove it
  if (
    outfit.rating !== undefined &&
    outfit.rating !== 1 &&
    outfit.rating !== 0 &&
    outfit.rating !== -1
  ) {
    const cleanedOutfit = {
      ...outfit,
      rating: undefined,
      updatedAt: new Date(),
    };
    // Save cleaned outfit back to database
    await saveOutfit(cleanedOutfit);
    return cleanedOutfit;
  }

  return outfit;
}

// Delete an outfit from IndexedDB
export async function deleteOutfit(id: string): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(OUTFITS_STORE, "readwrite");
  await tx.store.delete(id);
  await tx.done;
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
