/**
 * AI Embedding utilities for wear logging
 * Uses Transformers.js with Marqo-FashionCLIP for fashion-specific embeddings
 * Models are cached in browser after first download
 */

import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers';

// Cache the model to avoid reloading
let embeddingModel: CLIPVisionModelWithProjection | null = null;
let embeddingProcessor: AutoProcessor | null = null;
let isLoadingEmbedding = false;

/**
 * Get or load the FashionCLIP model
 * Models are automatically cached by Transformers.js after first download
 */
async function getEmbeddingModel() {
  // If already loaded, return cached model
  if (embeddingModel && embeddingProcessor) {
    return { model: embeddingModel, processor: embeddingProcessor };
  }

  // If currently loading, wait for it
  if (isLoadingEmbedding) {
    while (isLoadingEmbedding) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return { model: embeddingModel!, processor: embeddingProcessor! };
  }

  // Start loading (first time only - downloads ~200-500MB)
  isLoadingEmbedding = true;
  try {
    // Load Marqo-FashionCLIP model
    // First call downloads model, subsequent calls load from browser cache
    const processor = await AutoProcessor.from_pretrained('Marqo/marqo-fashionCLIP');
    const model = await CLIPVisionModelWithProjection.from_pretrained('Marqo/marqo-fashionCLIP');

    // Cache for future use
    embeddingProcessor = processor;
    embeddingModel = model;

    return { model, processor };
  } catch (error) {
    console.error('Failed to load embedding model:', error);
    isLoadingEmbedding = false;
    throw new Error('Failed to load fashion recognition model');
  } finally {
    isLoadingEmbedding = false;
  }
}

/**
 * Get CLIP embedding for an image
 * @param imageDataURL - Image as data URL (base64)
 * @returns Promise<number[]> - Embedding vector (normalized)
 */
export async function getImageEmbedding(imageDataURL: string): Promise<number[]> {
  try {
    const { model, processor } = await getEmbeddingModel();

    // Try reading data URL directly first
    let image: RawImage;
    let blobUrl: string | null = null;

    try {
      image = await RawImage.read(imageDataURL);
    } catch {
      // If direct read fails, convert to blob URL
      const response = await fetch(imageDataURL);
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      image = await RawImage.read(blobUrl);
    }

    if (!image) {
      throw new Error('Failed to load image');
    }

    try {
      // The processor expects images and processes them
      // Try different calling patterns to find what works
      let imageInputs: unknown;
      const processorFn = processor as unknown as (...args: unknown[]) => Promise<unknown>;

      // Pattern 1: Direct image argument
      try {
        imageInputs = await processorFn(image);
      } catch {
        // Pattern 2: Object with images property (single image)
        try {
          imageInputs = await processorFn({ images: image });
        } catch {
          // Pattern 3: Object with images array
          try {
            imageInputs = await processorFn({ images: [image] });
          } catch {
            // Pattern 4: With options
            imageInputs = await processorFn(image, {
              padding: 'max_length',
              return_tensors: 'pt',
            });
          }
        }
      }

      // Generate embedding
      const { image_embeds } = await model(imageInputs);

      // Normalize and return as array
      const normalized = image_embeds.normalize().tolist()[0];
      return normalized;
    } finally {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    }
  } catch (error) {
    console.error('Failed to get image embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a value between -1 and 1 (higher = more similar)
 * @param embedding1 - First embedding vector
 * @param embedding2 - Second embedding vector
 * @returns number - Similarity score (0-1 range typically)
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    const val1 = embedding1[i]!;
    const val2 = embedding2[i]!;
    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Check if AI features are available
 * Transformers.js models are always available (downloads on first use)
 */
export function isAIEnabled(): boolean {
  // Transformers.js works in browser, always available
  return true;
}

/**
 * Test model loading
 * Useful for checking if models can be loaded
 */
export async function testModelLoading(): Promise<boolean> {
  try {
    // Create a tiny 1x1 test image
    const testImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await getImageEmbedding(testImage);
    return true;
  } catch (error) {
    console.error('Model loading test failed:', error);
    return false;
  }
}

/**
 * Clear the in-memory model cache
 * This frees up RAM but models will need to be reloaded from browser cache on next use
 */
export function clearModelCache(): void {
  embeddingModel = null;
  embeddingProcessor = null;
  console.log('In-memory model cache cleared');
}

/**
 * Clear Transformers.js model cache from browser storage
 * This deletes the cached model files (~200-500MB) and frees up storage space
 * Models will need to be re-downloaded on next use
 */
export async function clearModelStorage(): Promise<void> {
  try {
    // Clear in-memory cache first
    clearModelCache();

    // Transformers.js stores models in the browser's Cache API
    // We need to delete caches that contain Hugging Face model files
    const cacheNames = await caches.keys();
    const transformersCaches = cacheNames.filter(
      (name) => name.includes('hf-transformers') || name.includes('transformers'),
    );

    // Delete all Transformers.js related caches
    await Promise.all(transformersCaches.map((cacheName) => caches.delete(cacheName)));

    // Also try to clear IndexedDB if Transformers.js uses it
    // Transformers.js may also store model metadata in IndexedDB
    try {
      const dbNames = await indexedDB.databases();
      const transformersDBs = dbNames.filter(
        (db) => db.name?.includes('transformers') || db.name?.includes('hf-transformers'),
      );
      for (const db of transformersDBs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (dbError) {
      // IndexedDB clearing is optional, don't fail if it doesn't work
      console.log('Could not clear IndexedDB caches:', dbError);
    }

    console.log(
      `Cleared ${transformersCaches.length} Transformers.js cache(s) from browser storage`,
    );
  } catch (error) {
    console.error('Failed to clear model storage:', error);
    throw new Error('Failed to clear model cache');
  }
}

/**
 * Get estimated cache size (if available)
 * Returns size in MB or null if unable to calculate
 */
export async function getModelCacheSize(): Promise<number | null> {
  try {
    const cacheNames = await caches.keys();
    const transformersCaches = cacheNames.filter(
      (name) => name.includes('hf-transformers') || name.includes('transformers'),
    );

    if (transformersCaches.length === 0) {
      return 0;
    }

    let totalSize = 0;
    for (const cacheName of transformersCaches) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    // Convert bytes to MB
    return Math.round((totalSize / (1024 * 1024)) * 100) / 100;
  } catch (error) {
    console.error('Failed to calculate cache size:', error);
    return null;
  }
}
