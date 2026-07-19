import type { ItemAnalysis, MetadataProvider } from './types.ts';

const COLORS = ['black', 'white', 'navy', 'beige', 'olive', 'burgundy', 'grey'];
const PATTERNS = ['solid', 'striped', 'floral', 'checked', 'plain'];
const MATERIALS = ['cotton', 'wool', 'polyester', 'linen', 'denim'];

const EMBEDDING_DIMENSIONS = 1536;

function pick<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)] as T;
}

// Unit-normalized so it behaves like a real embedding under the cosine-ops HNSW index, even
// though the values themselves are meaningless.
function mockEmbedding(dimensions: number): number[] {
  const raw = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(raw.reduce((sum, value) => sum + value * value, 0));
  return raw.map((value) => value / norm);
}

/**
 * Placeholder MetadataProvider — returns randomized, plausible-looking data instead of calling a
 * real model. No OpenAI integration yet; this exists so the rest of the pipeline (auth, fetch,
 * download, status transitions, DB write) can be built and exercised end-to-end first.
 */
export const mockProvider: MetadataProvider = {
  async analyze(): Promise<ItemAnalysis> {
    const color = pick(COLORS);
    const pattern = pick(PATTERNS);
    const material = pick(MATERIALS);

    return {
      description: `A ${pattern} ${color} item made of ${material}. (mock description — no AI provider configured yet)`,
      metadata: { color, pattern, material, source: 'mock' },
      embedding: mockEmbedding(EMBEDDING_DIMENSIONS),
    };
  },
};
