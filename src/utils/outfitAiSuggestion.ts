import type { WeatherData } from '../contexts/WeatherContext';
import { supabase } from './supabase';

export interface OutfitSuggestionResult {
  itemIds: string[];
  rationale: string;
}

interface SuggestOutfitResponse {
  status: 'completed' | 'no_candidates' | 'failed';
  itemIds?: string[];
  rationale?: string;
  error?: string;
}

/** Calls the suggest-outfit Edge Function and returns a suggested outfit, or null if the
 *  wardrobe currently has no eligible candidates. Unlike the fire-and-forget helpers in
 *  aiProcessing.ts, this is awaited — the UI needs the result to render the suggestion.
 *  `excludeItemIds` are never suggested; `avoidItemIds` are only made less likely. */
export async function requestOutfitSuggestion(
  weatherData: WeatherData | null,
  mood: string | null = null,
  excludeItemIds: string[] = [],
  avoidItemIds: string[] = [],
): Promise<OutfitSuggestionResult | null> {
  const weather = weatherData
    ? {
        actualTemp: weatherData.actualTemp,
        feelsLikeTemp: weatherData.feelsLikeTemp,
        precipitation: weatherData.precipitation,
      }
    : null;

  const { data, error } = await supabase.functions.invoke<SuggestOutfitResponse>('suggest-outfit', {
    body: { weather, mood, excludeItemIds, avoidItemIds },
  });

  if (error) {
    throw new Error(`Failed to get outfit suggestion: ${error.message}`);
  }
  if (!data) {
    throw new Error('Failed to get outfit suggestion: empty response');
  }
  if (data.status === 'failed') {
    throw new Error(data.error ?? 'Failed to get outfit suggestion');
  }
  if (data.status === 'no_candidates') {
    return null;
  }

  return { itemIds: data.itemIds ?? [], rationale: data.rationale ?? '' };
}
