import { differenceInDays } from 'date-fns';
import type { WeatherData } from '../contexts/WeatherContext';
import type { WardrobeItem } from '../types/wardrobe';
import { cosineSimilarity } from './aiEmbedding';
import { CATEGORY_PAIRINGS } from './categories';
import { NEGLECTED_ITEMS_THRESHOLD_DAYS } from './config';
import { isWornToday } from './wardrobeFilters';
import { filterItemsForWeather } from './weatherFiltering';

export interface OutfitSuggestion {
  featuredItem: WardrobeItem;
  complementaryItems: WardrobeItem[];
  daysSinceWorn: number;
}

/**
 * Calculate days since an item was last worn
 * Returns Infinity for never-worn items
 */
function getDaysSinceWorn(item: WardrobeItem): number {
  if (!item.wearHistory || item.wearHistory.length === 0) {
    return Infinity;
  }
  const lastWorn = new Date(item.wearHistory[item.wearHistory.length - 1]!);
  return differenceInDays(new Date(), lastWorn);
}

/**
 * Select a featured item with weighted random selection
 * Items not worn for longer get higher weight
 */
function selectFeaturedItem(
  items: WardrobeItem[],
  dismissedItemIds: Set<string>,
): WardrobeItem | null {
  // Filter to main clothing categories (tops, bottoms, dresses, outerwear)
  // Exclude dog casual items and dismissed items
  const candidates = items.filter(
    (item) =>
      ['tops', 'bottoms', 'dresses', 'outerwear'].includes(item.category) &&
      !item.isDogCasual &&
      !dismissedItemIds.has(item.id),
  );

  if (candidates.length === 0) {
    return null;
  }

  // Filter to neglected items (30+ days not worn)
  const neglectedCandidates = candidates.filter(
    (item) => getDaysSinceWorn(item) >= NEGLECTED_ITEMS_THRESHOLD_DAYS,
  );

  // If no neglected items, fall back to all candidates
  const pool = neglectedCandidates.length > 0 ? neglectedCandidates : candidates;

  // Weight by days since worn (longer = higher priority)
  // Cap at 365 days to prevent extreme weights
  const weights = pool.map((item) => {
    const days = getDaysSinceWorn(item);
    // Use log scale to prevent extreme weights for very old items
    // Never-worn items (Infinity) get a high but not extreme weight
    if (days === Infinity) return 100;
    return Math.min(Math.log(days + 1) * 20, 100);
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    random -= weights[i]!;
    if (random <= 0) {
      return pool[i]!;
    }
  }

  // Fallback to last item
  return pool[pool.length - 1] || null;
}

/**
 * Find complementary items to complete an outfit with the featured item
 */
export function findComplementaryItems(
  featuredItem: WardrobeItem,
  allItems: WardrobeItem[],
  count: number = 3,
): WardrobeItem[] {
  const pairingCategories = CATEGORY_PAIRINGS[featuredItem.category];

  if (!pairingCategories || pairingCategories.length === 0) {
    return [];
  }

  // Get items from complementary categories
  const candidates = allItems.filter(
    (item) =>
      pairingCategories.includes(item.category) &&
      !item.isDogCasual &&
      !isWornToday(item) &&
      item.id !== featuredItem.id,
  );

  if (candidates.length === 0) {
    return [];
  }

  // If featured item has embedding, sort by similarity
  if (featuredItem.embedding) {
    const withEmbeddings = candidates.filter((item) => item.embedding);
    const withoutEmbeddings = candidates.filter((item) => !item.embedding);

    // Sort items with embeddings by similarity (higher = more similar = better match)
    const sortedByEmbedding = withEmbeddings
      .map((item) => ({
        item,
        similarity: cosineSimilarity(featuredItem.embedding!, item.embedding!),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .map((entry) => entry.item);

    // Combine: embedding-matched items first, then others sorted by wear count
    const sortedWithoutEmbeddings = withoutEmbeddings.sort((a, b) => b.wearCount - a.wearCount);

    const allSorted = [...sortedByEmbedding, ...sortedWithoutEmbeddings];

    // Try to pick from different categories for variety
    return pickFromDifferentCategories(allSorted, count);
  }

  // Otherwise, prefer items with higher wear count (proven versatile)
  const sortedByWearCount = [...candidates].sort((a, b) => b.wearCount - a.wearCount);

  // Try to pick from different categories for variety
  return pickFromDifferentCategories(sortedByWearCount, count);
}

/**
 * Pick items from different categories when possible
 */
function pickFromDifferentCategories(items: WardrobeItem[], count: number): WardrobeItem[] {
  const result: WardrobeItem[] = [];
  const usedCategories = new Set<string>();

  // First pass: pick one from each category
  for (const item of items) {
    if (result.length >= count) break;
    if (!usedCategories.has(item.category)) {
      result.push(item);
      usedCategories.add(item.category);
    }
  }

  // Second pass: fill remaining slots with best items
  for (const item of items) {
    if (result.length >= count) break;
    if (!result.includes(item)) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Suggest a complete outfit with a neglected featured item and complementary pieces
 */
export function suggestRediscoverOutfit(
  items: WardrobeItem[],
  weatherData: WeatherData | null,
  dismissedItemIds: Set<string>,
): OutfitSuggestion | null {
  if (items.length === 0) {
    return null;
  }

  // Filter items appropriate for current weather
  const weatherAppropriate = filterItemsForWeather(items, weatherData);

  if (weatherAppropriate.length === 0) {
    return null;
  }

  // Select a featured neglected item
  const featuredItem = selectFeaturedItem(weatherAppropriate, dismissedItemIds);

  if (!featuredItem) {
    return null;
  }

  // Find complementary items
  const complementaryItems = findComplementaryItems(featuredItem, weatherAppropriate, 3);

  const daysSinceWorn = getDaysSinceWorn(featuredItem);

  return {
    featuredItem,
    complementaryItems,
    daysSinceWorn: daysSinceWorn === Infinity ? -1 : daysSinceWorn, // -1 indicates never worn
  };
}
