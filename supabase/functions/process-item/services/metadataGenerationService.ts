import { openai } from './openai/client.ts'
import { VISION_MODEL } from './openai/config.ts'
import { blobToDataUrl } from './openai/imageEncoding.ts'

const PROMPT =
  'Analyze this clothing item and extract structured metadata.' +
  'Only return the requested fields.' +
  'Use concise values (single words or short phrases).' +
  'If a value cannot be determined confidently from the image, return "unknown" rather than guessing.'

// Structured Outputs schema — OpenAI enforces this shape at generation time. We still validate
// independently in analysisValidationService.ts before persisting (defense in depth).
const METADATA_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', description: 'Garment type, e.g. sweater, shirt, jeans, jacket' },
    color: { type: 'string', description: 'Primary visible color of the item' },
    pattern: { type: 'string', description: 'e.g. solid, striped, floral, checked, plaid' },
    material: {
      type: 'string',
      description: 'Material if visually apparent, otherwise "unknown"',
    },
  },
  required: ['category', 'color', 'pattern', 'material'],
  additionalProperties: false,
} as const

export interface MetadataGenerator {
  generate(image: Blob): Promise<Record<string, unknown>>
}

export const openAiMetadataGenerator: MetadataGenerator = {
  async generate(image: Blob): Promise<Record<string, unknown>> {
    const imageDataUrl = await blobToDataUrl(image)

    const response = await openai.responses.create({
      model: VISION_MODEL,
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
    })

    return JSON.parse(response.output_text) as Record<string, unknown>
  },
}

// Swap this binding for a different implementation of MetadataGenerator later — the orchestrator
// and every other service stay unchanged.
export const metadataGenerator: MetadataGenerator = openAiMetadataGenerator
