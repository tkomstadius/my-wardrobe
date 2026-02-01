// Backup and restore utilities for wardrobe data

import type { Outfit } from '../types/outfit';
import type { WardrobeItem } from '../types/wardrobe';
import { loadItems, loadOutfits, saveItem, saveOutfit } from './storageCommands';
import { getCurrentUserId } from './supabase';
import { dataUrlToBlob, uploadItemImage, uploadOutfitPhoto } from './supabaseStorage';

export interface BackupData {
  version: string; // Backup format version (not database version)
  exportDate: string;
  items: WardrobeItem[];
  outfits: Outfit[];
}

/**
 * Fetch an image from a URL and convert to a base64 data URL.
 * Signed URLs from Supabase Storage are converted to self-contained data URLs
 * so backups are portable and don't expire.
 */
async function fetchAsDataUrl(url: string): Promise<string> {
  // Already a data URL (e.g. from an old backup) — pass through
  if (url.startsWith('data:')) return url;

  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert image to data URL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Export all wardrobe data to a JSON backup file.
 * Images are fetched from Supabase Storage and embedded as base64 data URLs
 * so the backup JSON is fully self-contained.
 */
export async function exportBackup(): Promise<Blob> {
  const items = await loadItems();
  const outfits = await loadOutfits();

  // Convert signed URL images to embedded data URLs
  const itemsWithDataUrls = await Promise.all(
    items.map(async (item) => ({
      ...item,
      imageUrl: await fetchAsDataUrl(item.imageUrl),
    })),
  );

  const outfitsWithDataUrls = await Promise.all(
    outfits.map(async (outfit) => ({
      ...outfit,
      photo: outfit.photo ? await fetchAsDataUrl(outfit.photo) : undefined,
    })),
  );

  const backupData: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    items: itemsWithDataUrls,
    outfits: outfitsWithDataUrls,
  };

  const json = JSON.stringify(backupData, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Generate a filename for the backup
 */
export function generateBackupFilename(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return `wardrobe-backup-${dateStr}.json`;
}

/**
 * Download backup file (for desktop browsers)
 */
export async function downloadBackup(): Promise<void> {
  const blob = await exportBackup();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generateBackupFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share backup file (for mobile - uses Web Share API)
 */
export async function shareBackup(): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) {
    // Fallback to download if share is not supported
    await downloadBackup();
    return true;
  }

  try {
    const blob = await exportBackup();
    const file = new File([blob], generateBackupFilename(), {
      type: 'application/json',
    });

    const shareData = {
      files: [file],
      title: 'My Wardrobe Backup',
      text: 'Backup of my wardrobe data',
    };

    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return true;
    }

    // Fallback to download if files can't be shared
    await downloadBackup();
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name === 'AbortError') {
      // User cancelled, not a real error
      return false;
    }
    throw error;
  }
}

/**
 * Validate backup data structure
 */
function validateBackupData(data: unknown): data is BackupData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const backup = data as Partial<BackupData>;

  return (
    typeof backup.version === 'string' &&
    typeof backup.exportDate === 'string' &&
    Array.isArray(backup.items) &&
    Array.isArray(backup.outfits)
  );
}

/**
 * Parse and validate backup file
 */
export async function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!validateBackupData(data)) {
          reject(new Error('Invalid backup file format'));
          return;
        }

        resolve(data);
      } catch {
        reject(new Error('Failed to parse backup file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Convert string dates back to Date objects after JSON parsing.
 * JSON.parse() converts Date objects to strings, but saveItem/saveOutfit expect Date objects.
 */
function convertDatesToObjects(data: BackupData): BackupData {
  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      wearHistory: item.wearHistory.map((dateStr) => new Date(dateStr)),
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })),
    outfits: data.outfits.map((outfit) => ({
      ...outfit,
      createdAt: new Date(outfit.createdAt),
      updatedAt: new Date(outfit.updatedAt),
    })),
  };
}

/**
 * Import backup data into Supabase.
 * Images (base64 data URLs) are uploaded to Supabase Storage, and the
 * storage paths are saved in the DB records.
 *
 * @param data Validated backup data
 * Note:
 * - Supabase upsert() will replace existing items with same IDs
 * - Backup version is independent of database version
 */
export async function importBackup(data: BackupData): Promise<{
  itemsImported: number;
  outfitsImported: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let itemsImported = 0;
  let outfitsImported = 0;

  const convertedData = convertDatesToObjects(data);
  const userId = await getCurrentUserId();

  // Import items — upload images to Storage, then save records
  for (const item of convertedData.items) {
    try {
      if (item.imageUrl.startsWith('data:')) {
        const blob = dataUrlToBlob(item.imageUrl);
        const storagePath = await uploadItemImage(userId, item.id, blob);
        item.imageUrl = storagePath;
      }
      await saveItem(item);
      itemsImported++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to import item ${item.id}: ${errorMsg}`);
      console.error('Failed to import item:', item.id, error);
    }
  }

  // Import outfits — upload photos to Storage, then save records
  for (const outfit of convertedData.outfits) {
    try {
      if (outfit.photo?.startsWith('data:')) {
        const blob = dataUrlToBlob(outfit.photo);
        const storagePath = await uploadOutfitPhoto(userId, outfit.id, blob);
        outfit.photo = storagePath;
      }
      await saveOutfit(outfit);
      outfitsImported++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to import outfit ${outfit.id}: ${errorMsg}`);
      console.error('Failed to import outfit:', outfit.id, error);
    }
  }

  return {
    itemsImported,
    outfitsImported,
    errors,
  };
}

/**
 * Check if Web Share API is available (typically mobile)
 */
export function isShareSupported(): boolean {
  return typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
}
