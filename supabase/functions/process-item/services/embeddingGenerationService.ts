// Must match the wardrobe_items.embedding column dimension (src/db/schema.ts), sized for
// OpenAI's text-embedding-3-small.
const EMBEDDING_DIMENSIONS = 1536;

// Unit-normalized so it behaves like a real embedding under the cosine-ops HNSW index, even
// though the values themselves are meaningless.
function mockEmbedding(dimensions: number): number[] {
  const raw = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(raw.reduce((sum, value) => sum + value * value, 0));
  return raw.map((value) => value / norm);
}

export interface EmbeddingGenerator {
  /**
   * Takes text, not an image — text-embedding-3-small (the model this column is sized for) only
   * accepts text. Callers pass the generated description, not the raw photo.
   */
  generate(text: string): Promise<number[]>;
}

/** Placeholder — returns a random unit vector instead of calling a real embedding model. */
export const mockEmbeddingGenerator: EmbeddingGenerator = {
  async generate(_text: string): Promise<number[]> {
    return mockEmbedding(EMBEDDING_DIMENSIONS);
  },
};

// Swap this binding for a real implementation of EmbeddingGenerator (e.g. OpenAI
// text-embedding-3-small) when ready — the orchestrator and every other service stay unchanged.
export const embeddingGenerator: EmbeddingGenerator = mockEmbeddingGenerator;
