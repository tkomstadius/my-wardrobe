import { supabase } from './supabase';

const BUCKET = 'wardrobe-images';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds
const CACHE_TTL_MS = 55 * 60 * 1000; // 55 minutes — refresh 5min before expiry

type CacheEntry = { url: string; expiresAt: number };
const urlCache = new Map<string, CacheEntry>();

function getCached(path: string): string | null {
  const entry = urlCache.get(path);
  if (entry && Date.now() < entry.expiresAt) return entry.url;
  urlCache.delete(path);
  return null;
}

function setCache(path: string, url: string): void {
  urlCache.set(path, { url, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateUrlCache(path: string): void {
  urlCache.delete(path);
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
