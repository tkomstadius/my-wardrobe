import { openai } from './openai/client.ts';
import { blobToDataUrl } from './openai/imageEncoding.ts';

// Overridable — see descriptionGenerationService.ts for why this one can be swapped freely.
const MODEL = Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o-mini';

const PROMPT =
  'Look at this clothing item photo and extract its color, pattern, and material. Be concise — ' +
  'single words or short phrases, not sentences.';

// Structured Outputs schema — OpenAI enforces this shape at generation time. We still validate
// independently in analysisValidationService.ts before persisting (defense in depth).
const METADATA_SCHEMA = {
  type: 'object',
  properties: {
    color: { type: 'string', description: 'The primary color of the item' },
    pattern: { type: 'string', description: 'e.g. solid, striped, floral, checked, plaid' },
    material: { type: 'string', description: 'Best guess at the fabric or material' },
  },
  required: ['color', 'pattern', 'material'],
  additionalProperties: false,
} as const;

export interface MetadataGenerator {
  generate(image: Blob): Promise<Record<string, unknown>>;
}

export const openAiMetadataGenerator: MetadataGenerator = {
  async generate(image: Blob): Promise<Record<string, unknown>> {
    const imageDataUrl = await blobToDataUrl(image);

    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: PROMPT },
            { type: 'input_image', image_url: imageDataUrl, detail: 'auto' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'garment_metadata',
          schema: METADATA_SCHEMA,
          strict: true,
        },
      },
      max_output_tokens: 150,
    });

    return JSON.parse(response.output_text) as Record<string, unknown>;
  },
};

// Swap this binding for a different implementation of MetadataGenerator later — the orchestrator
// and every other service stay unchanged.
export const metadataGenerator: MetadataGenerator = openAiMetadataGenerator;
