/**
 * One-time migration tool: IndexedDB → Supabase
 *
 * Reads items, outfits, feedback, and preferences from the existing IndexedDB
 * database and writes them to Supabase (Postgres + Storage). Images stored as
 * Blobs in IndexedDB are uploaded to Supabase Storage.
 *
 * This file directly accesses IndexedDB via the `idb` library. It will be
 * deleted along with `indexedDB.ts` once migration is confirmed.
 */

import { openDB } from 'idb';
import type { MatchFeedback, UserPreferences } from './aiLearning';
import { saveFeedback, saveUserPreferences } from './aiLearning';
import { saveItem, saveOutfits } from './storageCommands';
import { getCurrentUserId } from './supabase';
import { uploadItemImage, uploadOutfitPhoto } from './supabaseStorage';

const DB_NAME = 'MyWardrobeDB';
const DB_VERSION = 4;

export interface MigrationProgress {
  phase: 'items' | 'outfits' | 'feedback' | 'preferences' | 'done';
  current: number;
  total: number;
  errors: string[];
}

export interface MigrationResult {
  itemsMigrated: number;
  outfitsMigrated: number;
  feedbackMigrated: number;
  preferencesMigrated: boolean;
  errors: string[];
}

/**
 * Check if IndexedDB has any wardrobe data to migrate.
 */
export async function hasIndexedDBData(): Promise<boolean> {
  try {
    const databases = await indexedDB.databases();
    const exists = databases.some((db) => db.name === DB_NAME);
    if (!exists) return false;

    const db = await openDB(DB_NAME, DB_VERSION);
    const tx = db.transaction('items', 'readonly');
    const count = await tx.store.count();
    db.close();
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * Migrate all data from IndexedDB to Supabase.
 * @param onProgress Optional callback for progress updates.
 */
export async function migrateFromIndexedDB(
  onProgress?: (progress: MigrationProgress) => void,
): Promise<MigrationResult> {
  const errors: string[] = [];
  let itemsMigrated = 0;
  let outfitsMigrated = 0;
  let feedbackMigrated = 0;
  let preferencesMigrated = false;

  const userId = await getCurrentUserId();

  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create stores if they don't exist (matching indexedDB.ts upgrade logic)
      if (!db.objectStoreNames.contains('items')) {
        const store = db.createObjectStore('items', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('outfits')) {
        const store = db.createObjectStore('outfits', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains('matchFeedback')) {
          const store = db.createObjectStore('matchFeedback', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('suggestedItemId', 'suggestedItemId', { unique: false });
          store.createIndex('userAction', 'userAction', { unique: false });
          store.createIndex('outfitPhotoHash', 'outfitPhotoHash', { unique: false });
        }
        if (!db.objectStoreNames.contains('userPreferences')) {
          db.createObjectStore('userPreferences', { keyPath: 'id' });
        }
      }
    },
  });

  try {
    // ========== Phase 1: Migrate Items ==========
    const itemsTx = db.transaction('items', 'readonly');
    const dbItems = await itemsTx.store.getAll();
    const totalItems = dbItems.length;

    onProgress?.({ phase: 'items', current: 0, total: totalItems, errors });

    for (let i = 0; i < dbItems.length; i++) {
      const dbItem = dbItems[i] as Record<string, unknown>;
      if (!dbItem) continue;

      try {
        const itemId = dbItem.id as string;

        // Upload image Blob to Supabase Storage
        let storagePath = '';
        const imageBlob = dbItem.imageBlob as Blob | undefined;
        if (imageBlob && imageBlob instanceof Blob) {
          storagePath = await uploadItemImage(userId, itemId, imageBlob);
        } else if (typeof dbItem.imageUrl === 'string') {
          // Fallback: already a data URL (shouldn't happen but handle gracefully)
          const dataUrl = dbItem.imageUrl as string;
          const arr = dataUrl.split(',');
          const mimeMatch = arr[0]?.match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const bstr = atob(arr[1] ?? '');
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          storagePath = await uploadItemImage(userId, itemId, blob);
        }

        const wearHistory = Array.isArray(dbItem.wearHistory)
          ? (dbItem.wearHistory as string[]).map((d) => new Date(d))
          : [];

        const initialWearCount = (dbItem.initialWearCount as number) ?? 0;
        const rating = dbItem.rating as number | undefined;

        await saveItem({
          id: itemId,
          imageUrl: storagePath,
          notes: (dbItem.notes as string) ?? undefined,
          brand: (dbItem.brand as string) ?? undefined,
          category: dbItem.category as string as import('../types/wardrobe').ItemCategory,
          subCategory: (dbItem.subCategory as string) ?? undefined,
          wearCount: (dbItem.wearCount as number) ?? initialWearCount + wearHistory.length,
          initialWearCount,
          wearHistory,
          price: dbItem.price != null ? Number(dbItem.price) : undefined,
          isSecondHand: (dbItem.isSecondHand as boolean) ?? undefined,
          isDogCasual: (dbItem.isDogCasual as boolean) ?? undefined,
          isHandmade: (dbItem.isHandmade as boolean) ?? undefined,
          rating: rating === 1 || rating === 0 || rating === -1 ? rating : undefined,
          purchaseDate: dbItem.purchaseDate ? new Date(dbItem.purchaseDate as string) : undefined,
          embedding: (dbItem.embedding as number[]) ?? undefined,
          createdAt: dbItem.createdAt ? new Date(dbItem.createdAt as string) : new Date(),
          updatedAt: dbItem.updatedAt ? new Date(dbItem.updatedAt as string) : new Date(),
        });

        itemsMigrated++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Item ${dbItem.id}: ${msg}`);
        console.error('Failed to migrate item:', dbItem.id, error);
      }

      onProgress?.({ phase: 'items', current: i + 1, total: totalItems, errors });
    }

    // ========== Phase 2: Migrate Outfits ==========
    const outfitsTx = db.transaction('outfits', 'readonly');
    const dbOutfits = await outfitsTx.store.getAll();
    const totalOutfits = dbOutfits.length;

    onProgress?.({ phase: 'outfits', current: 0, total: totalOutfits, errors });

    const outfitsToSave: import('../types/outfit').Outfit[] = [];

    for (let i = 0; i < dbOutfits.length; i++) {
      const dbOutfit = dbOutfits[i] as Record<string, unknown>;
      if (!dbOutfit) continue;

      try {
        const outfitId = dbOutfit.id as string;

        // Upload photo Blob if present
        let photoPath: string | undefined;
        const photoBlob = dbOutfit.photoBlob as Blob | undefined;
        if (photoBlob && photoBlob instanceof Blob) {
          photoPath = await uploadOutfitPhoto(userId, outfitId, photoBlob);
        }

        const rating = dbOutfit.rating as number | undefined;

        outfitsToSave.push({
          id: outfitId,
          photo: photoPath,
          itemIds: Array.isArray(dbOutfit.itemIds) ? (dbOutfit.itemIds as string[]) : [],
          notes: (dbOutfit.notes as string) ?? undefined,
          rating: rating === 1 || rating === 0 || rating === -1 ? rating : undefined,
          createdAt: dbOutfit.createdAt ? new Date(dbOutfit.createdAt as string) : new Date(),
          updatedAt: dbOutfit.updatedAt ? new Date(dbOutfit.updatedAt as string) : new Date(),
        });

        outfitsMigrated++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Outfit ${dbOutfit.id}: ${msg}`);
        console.error('Failed to migrate outfit:', dbOutfit.id, error);
      }

      onProgress?.({ phase: 'outfits', current: i + 1, total: totalOutfits, errors });
    }

    // Batch save outfits
    if (outfitsToSave.length > 0) {
      try {
        await saveOutfits(outfitsToSave);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Outfits batch save: ${msg}`);
        outfitsMigrated = 0;
      }
    }

    // ========== Phase 3: Migrate Feedback ==========
    if (db.objectStoreNames.contains('matchFeedback')) {
      const feedbackTx = db.transaction('matchFeedback', 'readonly');
      const dbFeedback = await feedbackTx.store.getAll();
      const totalFeedback = dbFeedback.length;

      onProgress?.({ phase: 'feedback', current: 0, total: totalFeedback, errors });

      for (let i = 0; i < dbFeedback.length; i++) {
        const record = dbFeedback[i] as Record<string, unknown>;
        if (!record) continue;

        try {
          const feedback: MatchFeedback = {
            id: record.id as string,
            timestamp: record.timestamp ? new Date(record.timestamp as string) : new Date(),
            outfitPhotoHash: (record.outfitPhotoHash as string) ?? '',
            suggestedItemId: (record.suggestedItemId as string) ?? '',
            baseSimilarity: (record.baseSimilarity as number) ?? 0,
            boostedSimilarity: (record.boostedSimilarity as number) ?? 0,
            confidence: (record.confidence as 'high' | 'medium' | 'low') ?? 'low',
            userAction: (record.userAction as 'accepted' | 'rejected') ?? 'rejected',
            metadata: (record.metadata as MatchFeedback['metadata']) ?? {
              category: 'tops' as import('../types/wardrobe').ItemCategory,
              wearCount: 0,
              itemAge: 0,
            },
          };

          await saveFeedback(feedback);
          feedbackMigrated++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Feedback ${record.id}: ${msg}`);
        }

        onProgress?.({ phase: 'feedback', current: i + 1, total: totalFeedback, errors });
      }
    }

    // ========== Phase 4: Migrate Preferences ==========
    if (db.objectStoreNames.contains('userPreferences')) {
      const prefsTx = db.transaction('userPreferences', 'readonly');
      const dbPrefs = await prefsTx.store.getAll();

      onProgress?.({ phase: 'preferences', current: 0, total: dbPrefs.length, errors });

      for (const record of dbPrefs) {
        const pref = record as Record<string, unknown>;
        if (!pref) continue;

        try {
          const preferences: UserPreferences = {
            categoryMatchWeight: (pref.categoryMatchWeight as number) ?? 1.0,
            brandMatchWeight: (pref.brandMatchWeight as number) ?? 1.0,
            recencyWeight: (pref.recencyWeight as number) ?? 1.0,
            wearFrequencyWeight: (pref.wearFrequencyWeight as number) ?? 1.0,
            highConfidenceThreshold: (pref.highConfidenceThreshold as number) ?? 0.78,
            mediumConfidenceThreshold: (pref.mediumConfidenceThreshold as number) ?? 0.68,
            totalFeedbackCount: (pref.totalFeedbackCount as number) ?? 0,
            lastUpdated: pref.lastUpdated ? new Date(pref.lastUpdated as string) : new Date(),
            version: (pref.version as number) ?? 1,
          };

          await saveUserPreferences(preferences);
          preferencesMigrated = true;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Preferences: ${msg}`);
        }
      }

      onProgress?.({
        phase: 'preferences',
        current: dbPrefs.length,
        total: dbPrefs.length,
        errors,
      });
    }

    onProgress?.({ phase: 'done', current: 0, total: 0, errors });
  } finally {
    db.close();
  }

  return {
    itemsMigrated,
    outfitsMigrated,
    feedbackMigrated,
    preferencesMigrated,
    errors,
  };
}

/**
 * Delete the IndexedDB database after successful migration.
 */
export async function clearIndexedDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete IndexedDB'));
    request.onblocked = () => {
      console.warn('IndexedDB deletion blocked — close other tabs using this database.');
      reject(new Error('IndexedDB deletion blocked — close other tabs'));
    };
  });
}
