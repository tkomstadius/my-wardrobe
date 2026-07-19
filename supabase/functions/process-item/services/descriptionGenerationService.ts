import { openai } from './openai/client.ts'
import { VISION_MODEL } from './openai/config.ts'
import { blobToDataUrl } from './openai/imageEncoding.ts'

const PROMPT =
  'Write a concise factual description of this clothing item for embedding generation.' +
  'Include only visually observable characteristics that help distinguish it from other garments:' +
  'garment type' +
  'primary colors' +
  'fabric appearance or material (only when reasonably confident)' +
  'fit or silhouette' +
  'pattern or texture' +
  'notable construction or design details (e.g. collar, sleeves, pockets, buttons, logo)' +
  'Prioritize details that help distinguish this item from visually similar garments.' +
  'Keep the description under 40 words.' +
  'Do not use marketing language or subjective adjectives.' +
  'Do not mention the image, background, lighting or mannequin.'

export interface DescriptionGenerator {
  generate(image: Blob): Promise<string>
}

export const openAiDescriptionGenerator: DescriptionGenerator = {
  async generate(image: Blob): Promise<string> {
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
      max_output_tokens: 300,
    })

    return response.output_text.trim()
  },
}

// Swap this binding for a different implementation of DescriptionGenerator later — the
// orchestrator and every other service stay unchanged.
export const descriptionGenerator: DescriptionGenerator = openAiDescriptionGenerator
