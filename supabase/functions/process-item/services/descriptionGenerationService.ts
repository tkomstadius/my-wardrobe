import { openai } from './openai/client.ts';
import { blobToDataUrl } from './openai/imageEncoding.ts';

// Overridable — unlike the embedding model, description quality/cost is a free choice.
const MODEL = Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o-mini';

const PROMPT =
  'Describe this clothing item in 1-3 sentences of natural language, suitable for semantic ' +
  'search (embedding-based similarity matching against other wardrobe items). Mention garment ' +
  'type, color, material, pattern, and any notable style details visible in the photo. Do not ' +
  'mention the background, lighting, or that this is a photo.';

export interface DescriptionGenerator {
  generate(image: Blob): Promise<string>;
}

export const openAiDescriptionGenerator: DescriptionGenerator = {
  async generate(image: Blob): Promise<string> {
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
      max_output_tokens: 300,
    });

    return response.output_text.trim();
  },
};

// Swap this binding for a different implementation of DescriptionGenerator later — the
// orchestrator and every other service stay unchanged.
export const descriptionGenerator: DescriptionGenerator = openAiDescriptionGenerator;
