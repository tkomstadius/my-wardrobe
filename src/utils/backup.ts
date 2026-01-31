// Backup and restore utilities for wardrobe data

import type { Outfit } from '../types/outfit';
import type { WardrobeItem } from '../types/wardrobe';
import { loadAllItems, loadAllOutfits, saveItem, saveOutfit } from './indexedDB';

export interface BackupData {
  version: string; // Backup format version (not database version)
  exportDate: string;
  items: WardrobeItem[];
  outfits: Outfit[];
}

/**
 * Export all wardrobe data to a JSON backup file
 */
export async function exportBackup(): Promise<Blob> {
  // Load all data from IndexedDB
  const items = await loadAllItems();
  const outfits = await loadAllOutfits();

  const backupData: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    items,
    outfits,
  };

  // Convert to JSON blob
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
 * Convert string dates back to Date objects after JSON parsing
 * JSON.parse() converts Date objects to strings, but saveItem/saveOutfit expect Date objects
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
 * Import backup data into IndexedDB
 * @param data Validated backup data
 * Note:
 * - IndexedDB put() will replace existing items with same IDs
 * - Backup version is independent of database version
 * - Data will be imported into current database schema via saveItem/saveOutfit
 */
export async function importBackup(data: BackupData): Promise<{
  itemsImported: number;
  outfitsImported: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let itemsImported = 0;
  let outfitsImported = 0;

  // Convert date strings back to Date objects (JSON.parse converts them to strings)
  const convertedData = convertDatesToObjects(data);

  // Import items (will overwrite items with same IDs)
  for (const item of convertedData.items) {
    try {
      await saveItem(item);
      itemsImported++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to import item ${item.id}: ${errorMsg}`);
      console.error('Failed to import item:', item.id, error);
    }
  }

  // Import outfits (will overwrite outfits with same IDs)
  for (const outfit of convertedData.outfits) {
    try {
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
