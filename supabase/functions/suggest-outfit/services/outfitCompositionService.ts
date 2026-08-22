import { openai } from '../../process-item/services/openai/client.ts';
import type { CandidateItem } from './candidateGatheringService.ts';

// Text-only reasoning over descriptions/metadata already on file — no vision call, so this
// doesn't need OPENAI_VISION_MODEL. Not worth its own env var for v1.
const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT =
  'You style outfits from a user\'s existing wardrobe. You will be given a JSON list of candidate ' +
  'items (each with an id, category, subCategory, AI-generated description, metadata, the user\'s ' +
  'own free-text notes on that item, and notes left on past outfits that included it) and the ' +
  'current weather. ' +
  'Choose ONE coherent, wearable outfit: normally a top + bottom, or a single dress/jumpsuit, ' +
  'optionally adding outerwear, shoes, and up to a couple of accessories — do not just return ' +
  'every candidate. ' +
  'Treat each item\'s notes and pastOutfitNotes as authoritative signal from the user (fit issues, ' +
  'comfort, known good/bad pairings, care instructions) and let them actively steer which items ' +
  'you include or avoid. ' +
  'Dress appropriately for the given weather; if no weather is given, ignore it. ' +
  'A mood may also be given (e.g. "comfortable", "edgy", "pick-me-up", "polished", "cozy", or any ' +
  'other free-form word) — let it meaningfully shape which items you pick: infer what it implies ' +
  'about fit, color, pattern, and material from each candidate\'s description/metadata, and favor ' +
  'items that match. If no mood is given, ignore it. ' +
  'Only choose itemIds that appear in the candidate list. ' +
  'Keep rationale to 1-2 sentences, mentioning weather, mood, or notes when they influenced your choice.';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    itemIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'IDs of the chosen items, drawn only from the provided candidate list',
    },
    rationale: {
      type: 'string',
      description: 'Short (1-2 sentence) explanation of why these pieces work together',
    },
  },
  required: ['itemIds', 'rationale'],
  additionalProperties: false,
} as const;

export interface OutfitWeather {
  actualTemp: string;
  feelsLikeTemp: string;
  precipitation: string;
}

export interface ComposedOutfit {
  itemIds: string[];
  rationale: string;
}

export interface OutfitComposer {
  compose(
    candidates: CandidateItem[],
    weather: OutfitWeather | null,
    mood: string | null,
  ): Promise<ComposedOutfit>;
}

export const openAiOutfitComposer: OutfitComposer = {
  async compose(
    candidates: CandidateItem[],
    weather: OutfitWeather | null,
    mood: string | null,
  ): Promise<ComposedOutfit> {
    const userPayload = {
      weather: weather ?? 'unknown',
      mood: mood ?? 'none specified',
      candidates,
    };

    const response = await openai.responses.create({
      model: MODEL,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'outfit_suggestion',
          schema: RESPONSE_SCHEMA,
          strict: true,
        },
      },
      max_output_tokens: 500,
    });

    return JSON.parse(response.output_text) as ComposedOutfit;
  },
};

// Swap this binding for a different implementation of OutfitComposer later — the orchestrator and
// every other service stay unchanged.
export const outfitComposer: OutfitComposer = openAiOutfitComposer;
