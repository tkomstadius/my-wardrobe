import type { ComposedOutfit } from './outfitCompositionService.ts';

/** Throws a clear Error unless, after dropping any itemIds the model hallucinated (not present in
 *  the candidate set) and deduping, at least one item remains. Defense in depth — Structured
 *  Outputs constrains shape, not which ids are real. */
export function validateSuggestion(candidate: ComposedOutfit, candidateIds: Set<string>): ComposedOutfit {
  if (!Array.isArray(candidate.itemIds)) {
    throw new Error('Validation failed: itemIds must be an array');
  }

  const itemIds = [...new Set(candidate.itemIds)].filter((id) => candidateIds.has(id));

  if (itemIds.length === 0) {
    throw new Error('Validation failed: no valid itemIds remained after filtering to known candidates');
  }

  if (typeof candidate.rationale !== 'string' || candidate.rationale.trim().length === 0) {
    throw new Error('Validation failed: rationale must be a non-empty string');
  }

  return { itemIds, rationale: candidate.rationale.trim() };
}
