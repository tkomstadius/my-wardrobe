/**
 * Temporary store for embedding data during image upload flow
 * This avoids putting large embedding arrays in hidden form inputs
 */

let pendingEmbedding: number[] | null = null;

export function setPendingEmbedding(embedding: number[] | null): void {
  pendingEmbedding = embedding;
}

export function getPendingEmbedding(): number[] | null {
  return pendingEmbedding;
}

export function clearPendingEmbedding(): void {
  pendingEmbedding = null;
}

/**
 * Get and clear the pending embedding in one operation
 * Useful for consuming the embedding in form actions
 */
export function consumePendingEmbedding(): number[] | null {
  const embedding = pendingEmbedding;
  pendingEmbedding = null;
  return embedding;
}
