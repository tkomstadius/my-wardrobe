// Must match wardrobe_items.embedding's dimensions (src/db/schema.ts).
const EMBEDDING_DIMENSIONS = 1536;
export const MAX_DESCRIPTION_LENGTH = 2000;
const REQUIRED_METADATA_FIELDS = ['category', 'color', 'pattern', 'material'] as const;

interface AnalysisCandidate {
  description: unknown;
  metadata: unknown;
  embedding: unknown;
}

// Deliberately not ItemAnalysis (persistenceService.ts) — this is just the AI-generated content
// that gets validated. model/promptVersion/processedAt are operational metadata the orchestrator
// attaches afterward, not something to validate here.
export interface ValidatedAnalysisContent {
  description: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

/** Throws a clear Error unless `embedding` is exactly EMBEDDING_DIMENSIONS finite numbers.
 *  Standalone so regenerate-embedding (re-embeds edited text without touching description/
 *  metadata) can validate without pulling in the description/metadata checks below. */
export function validateEmbedding(embedding: unknown): number[] {
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
    const got = Array.isArray(embedding) ? `array of ${embedding.length}` : typeof embedding;
    throw new Error(`Validation failed: embedding must be an array of ${EMBEDDING_DIMENSIONS} numbers, got ${got}`);
  }
  if (!embedding.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new Error('Validation failed: embedding must contain only finite numbers');
  }
  return embedding as number[];
}

/**
 * Throws a clear, specific Error if the AI-generated analysis doesn't look sane. OpenAI's
 * Structured Outputs already enforces the metadata schema at generation time, but this runs
 * regardless of provider — defense in depth against refusals, truncated output, or a future
 * provider swap that doesn't enforce a schema at all.
 */
export function validateAnalysis(candidate: AnalysisCandidate): ValidatedAnalysisContent {
  const { description, metadata, embedding } = candidate;

  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('Validation failed: description must be a non-empty string');
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(`Validation failed: description exceeds ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    throw new Error('Validation failed: metadata must be an object');
  }
  const metadataRecord = metadata as Record<string, unknown>;
  for (const key of REQUIRED_METADATA_FIELDS) {
    const value = metadataRecord[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Validation failed: metadata.${key} must be a non-empty string`);
    }
  }

  return {
    description: description.trim(),
    metadata: metadataRecord,
    embedding: validateEmbedding(embedding),
  };
}
