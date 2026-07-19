// Shared by descriptionGenerationService.ts and metadataGenerationService.ts, and recorded on
// the item row (ai_model) so it's clear which model produced a given analysis.
export const VISION_MODEL = Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o-mini';

// Bump this by hand whenever either vision prompt changes meaningfully. Recorded on the item row
// (ai_prompt_version) so items processed under an old prompt can be found and reprocessed later
// instead of guessing or reprocessing everything.
export const PROMPT_VERSION = 1;
