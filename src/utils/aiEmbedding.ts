/**
 * AI Embedding utilities for wear logging
 * Calls Netlify Function which securely proxies to Hugging Face Inference API
 */

interface EmbeddingResponse {
  embedding: number[];
}

interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

/**
 * Get CLIP embedding for an image
 * @param imageDataURL - Image as data URL (base64)
 * @returns Promise<number[]> - 512-dimensional embedding vector
 */
export async function getImageEmbedding(
  imageDataURL: string
): Promise<number[]> {
  try {
    // Call our Netlify Function (not Hugging Face directly)
    const response = await fetch("/.netlify/functions/get-embedding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageDataURL }),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Failed to get embedding");
    }

    const data: EmbeddingResponse = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error("Invalid embedding response from server");
    }

    return data.embedding;
  } catch (error) {
    console.error("Failed to get image embedding:", error);
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
export function cosineSimilarity(
  embedding1: number[],
  embedding2: number[]
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have same dimensions");
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
 * Note: This only checks if the function exists, not if credentials are configured
 * The function itself will return proper errors if credentials are missing
 */
export function isAIEnabled(): boolean {
  // In production (Netlify), the function is always available
  // In development, it's available if running Netlify Dev
  return true;
}

/**
 * Test API connection
 */
export async function testAPIConnection(): Promise<boolean> {
  try {
    // Create a tiny 1x1 test image
    const testImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    await getImageEmbedding(testImage);
    return true;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
}
