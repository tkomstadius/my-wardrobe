import { openai } from './openai/client.ts';

// Fixed, not overridable — must match wardrobe_items.embedding's dimensions (src/db/schema.ts,
// and the HNSW index built for them). Changing the model here without a matching column
// migration would produce a dimension mismatch error on save.
const EMBEDDING_MODEL = 'text-embedding-3-small';

export interface EmbeddingGenerator {
  /**
   * Takes text, not an image — text-embedding-3-small only accepts text. Callers pass the
   * generated description, not the raw photo.
   */
  generate(text: string): Promise<number[]>;
}

export const openAiEmbeddingGenerator: EmbeddingGenerator = {
  async generate(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('OpenAI embeddings response contained no data');
    }
    return embedding;
  },
};

// Swap this binding for a different implementation of EmbeddingGenerator later — the orchestrator
// and every other service stay unchanged. (In practice this one is unlikely to change without
// also migrating the embedding column's dimensions.)
export const embeddingGenerator: EmbeddingGenerator = openAiEmbeddingGenerator;
