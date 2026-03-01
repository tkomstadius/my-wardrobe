import { getEmbeddingFromApi } from './aiApi';

export async function getImageEmbedding(imageUrl: string): Promise<number[]> {
  // Pass the URL/data URL directly — the HF Space handles both https:// and data: inputs
  return getEmbeddingFromApi(imageUrl);
}

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

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

export function isAIEnabled(): boolean {
  return true;
}

/** No-op — model now runs server-side on HF Space */
export function clearModelCache(): void {}

/** No-op — model now runs server-side on HF Space */
export async function clearModelStorage(): Promise<void> {}

/** Returns 0 — model now runs server-side on HF Space */
export async function getModelCacheSize(): Promise<number | null> {
  return 0;
}
