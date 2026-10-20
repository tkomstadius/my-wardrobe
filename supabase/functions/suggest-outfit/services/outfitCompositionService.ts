import { openai } from '../../process-item/services/openai/client.ts';
import type { CandidatePool } from './candidateGatheringService.ts';

// Text-only reasoning over descriptions/metadata already on file — no vision call, so this
// doesn't need OPENAI_VISION_MODEL. Not worth its own env var for v1.
const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT =
  'You style outfits from a user\'s existing wardrobe. You will be given a JSON list of candidate ' +
  'items (each with an id, category, subCategory, brand, AI-generated description, metadata, the ' +
  'user\'s own free-text notes on that item, notes left on past outfits that included it, and ' +
  'usage signals), a few favoriteOutfits the user previously rated good, and the current weather. ' +
  'Candidates are a random sample of the wardrobe, already weighted toward what the user wears and ' +
  'likes. ' +
  'Choose ONE coherent, wearable outfit: normally a top + bottom, or a single dress/jumpsuit, ' +
  'optionally adding outerwear, shoes, and up to a couple of accessories — do not just return ' +
  'every candidate. ' +
  'Treat each item\'s notes and pastOutfitNotes as authoritative signal from the user (fit issues, ' +
  'comfort, known good/bad pairings, care instructions) and let them actively steer which items ' +
  'you include or avoid. ' +
  'Use signals as taste evidence: userRating 1 = loved, -1 = disliked (avoid unless nothing else ' +
  'fits); a high wearsPerMonth or goodOutfits count means a trusted staple; nopeOutfits means it ' +
  'has been part of outfits the user disliked. ' +
  'Use favoriteOutfits to understand the user\'s style and which pieces pair well. You may build ' +
  'around one, but swap at least one piece rather than repeating it exactly — the goal is fresh ' +
  'combinations the user is likely to enjoy, not reruns. ' +
  'Dress appropriately for the given weather; if no weather is given, ignore it. ' +
  'A mood may also be given (e.g. "comfortable", "edgy", "pick-me-up", "polished", "cozy", or any ' +
  'other free-form word) — let it meaningfully shape which items you pick: infer what it implies ' +
  'about fit, color, pattern, and material from each candidate\'s description/metadata, and favor ' +
  'items that match. If no mood is given, ignore it. ' +
  'Only choose itemIds that appear in the candidate list. ' +
  'Keep rationale to 1-2 sentences, mentioning weather, mood, notes, or past favorites when they ' +
  'influenced your choice.';

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
    pool: CandidatePool,
    weather: OutfitWeather | null,
    mood: string | null,
  ): Promise<ComposedOutfit>;
}

export const openAiOutfitComposer: OutfitComposer = {
  async compose(
    pool: CandidatePool,
    weather: OutfitWeather | null,
    mood: string | null,
  ): Promise<ComposedOutfit> {
    const userPayload = {
      weather: weather ?? 'unknown',
      mood: mood ?? 'none specified',
      favoriteOutfits: pool.favoriteOutfits,
      candidates: pool.candidates,
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
