export interface ItemAnalysis {
  description: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

/**
 * Anything that can turn an item photo into an analysis. Swap the implementation wired up in
 * index.ts (currently mockProvider) for a real AI-backed one later — the handler doesn't change.
 */
export interface MetadataProvider {
  analyze(image: Blob, context: { itemId: string }): Promise<ItemAnalysis>;
}
