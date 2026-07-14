import { supabase } from './supabase';

const BUCKET = 'wardrobe-images';
const SIGNED_URL_EXPIRY = 7 * 24 * 3600; // 7 days in seconds
const CACHE_TTL_MS = 6.5 * 24 * 60 * 60 * 1000; // 6.5 days — refresh before expiry
const LS_KEY = 'wardrobe_img_url_cache';

type CacheEntry = { url: string; expiresAt: number };
// In-memory layer avoids JSON.parse on every lookup within a session
const memCache = new Map<string, CacheEntry>();

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    for (const [path, entry] of Object.entries(entries)) {
      if (entry.expiresAt > now) memCache.set(path, entry);
    }
  } catch {
    // Corrupt storage — start fresh
    localStorage.removeItem(LS_KEY);
  }
}

function persistToStorage(): void {
  try {
    const entries: Record<string, CacheEntry> = {};
    for (const [path, entry] of memCache.entries()) {
      entries[path] = entry;
    }
    localStorage.setItem(LS_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota exceeded — skip persistence, in-memory cache still works
  }
}

// Load persisted cache once on module init
loadFromStorage();

function getCached(path: string): string | null {
  const entry = memCache.get(path);
  if (entry && Date.now() < entry.expiresAt) return entry.url;
  memCache.delete(path);
  return null;
}

function setCache(path: string, url: string): void {
  memCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL_MS });
  persistToStorage();
}

export function invalidateUrlCache(path: string): void {
  memCache.delete(path);
  persistToStorage();
}

/**
 * Upload an item image to Supabase Storage.
 * Returns the storage path (not a URL).
 */
export async function uploadItemImage(userId: string, itemId: string, blob: Blob): Promise<string> {
  const path = `${userId}/items/${itemId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload item image: ${error.message}`);
  }

  invalidateUrlCache(path);
  return path;
}

/**
 * Upload an outfit photo to Supabase Storage.
 * Returns the storage path (not a URL).
 */
export async function uploadOutfitPhoto(
  userId: string,
  outfitId: string,
  blob: Blob,
): Promise<string> {
  const path = `${userId}/outfits/${outfitId}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload outfit photo: ${error.message}`);
  }

  invalidateUrlCache(path);
  return path;
}

/**
 * Delete an image from Supabase Storage.
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }

  invalidateUrlCache(path);
}

/**
 * Generate a signed URL for a single storage path.
 * Returns the signed URL for use in <img src>.
 */
export async function getSignedUrl(path: string): Promise<string> {
  const cached = getCached(path);
  if (cached) return cached;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${error?.message ?? 'No URL returned'}`);
  }

  setCache(path, data.signedUrl);
  return data.signedUrl;
}

/**
 * Generate signed URLs for multiple storage paths in one request.
 * Returns a map of path → signed URL.
 */
export async function getSignedUrls(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();

  const urlMap = new Map<string, string>();
  const uncached: string[] = [];

  for (const path of paths) {
    const cached = getCached(path);
    if (cached) {
      urlMap.set(path, cached);
    } else {
      uncached.push(path);
    }
  }

  if (uncached.length === 0) return urlMap;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(uncached, SIGNED_URL_EXPIRY);

  if (error || !data) {
    throw new Error(`Failed to get signed URLs: ${error?.message ?? 'No data returned'}`);
  }

  for (const item of data) {
    if (item.signedUrl && item.path) {
      setCache(item.path, item.signedUrl);
      urlMap.set(item.path, item.signedUrl);
    }
  }

  return urlMap;
}

/**
 * Convert a data URL string to a Blob for uploading.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1] ?? '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}
