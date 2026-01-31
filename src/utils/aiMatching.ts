import type { WardrobeItem } from '../types/wardrobe';
import { cosineSimilarity, getImageEmbedding } from './aiEmbedding';
import { getDefaultPreferences, loadUserPreferences, type UserPreferences } from './aiLearning';

export interface ItemMatch {
  item: WardrobeItem;
  similarity: number;
  percentage: number;
  confidence: 'high' | 'medium' | 'low';
  baseSimilarity: number; // Original similarity before boosting
  boost: number; // How much the score was boosted
}

/**
 * Apply metadata-based boosting to similarity scores
 * Uses wardrobe context to improve match quality
 */
function boostScore(
  baseSimilarity: number,
  wardrobeItem: WardrobeItem,
  allItems: WardrobeItem[],
  preferences: UserPreferences,
): { boostedScore: number; boost: number } {
  let boosted = baseSimilarity;
  let totalBoost = 0;

  // Recency bias: Recently added items are more likely to be worn
  // Weight is learned from user feedback
  const itemAge = Date.now() - new Date(wardrobeItem.createdAt).getTime();
  const daysOld = itemAge / (24 * 60 * 60 * 1000);
  if (daysOld < 30) {
    // Added in last 30 days
    const recencyBoost = 1.0 + 0.08 * preferences.recencyWeight; // Learned weight
    boosted *= recencyBoost;
    totalBoost += recencyBoost - 1;
  }

  // Wear frequency: Items worn recently are more likely to be worn again
  // Weight is learned from user feedback
  if (wardrobeItem.wearHistory && wardrobeItem.wearHistory.length > 0) {
    const lastWornDate = new Date(wardrobeItem.wearHistory[wardrobeItem.wearHistory.length - 1]!);
    const daysSinceWorn = (Date.now() - lastWornDate.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceWorn < 7) {
      // Worn in last week
      const wearBoost = 1.0 + 0.06 * preferences.wearFrequencyWeight; // Learned weight
      boosted *= wearBoost;
      totalBoost += wearBoost - 1;
    }
  }

  // High wear count items (favorites)
  // Weight is learned from user feedback
  if (wardrobeItem.wearCount > 10) {
    const favoriteBoost = 1.0 + 0.05 * preferences.wearFrequencyWeight; // Learned weight
    boosted *= favoriteBoost;
    totalBoost += favoriteBoost - 1;
  }

  // Brand consistency: Users tend to wear same brands
  // Weight is learned from user feedback
  const brandCount = allItems.filter(
    (item) => item.brand === wardrobeItem.brand && item.brand,
  ).length;
  if (brandCount > 5) {
    // Frequently owned brand
    const brandBoost = 1.0 + 0.04 * preferences.brandMatchWeight; // Learned weight
    boosted *= brandBoost;
    totalBoost += brandBoost - 1;
  }

  // Cap at 1.0 (perfect match)
  return {
    boostedScore: Math.min(boosted, 1.0),
    boost: totalBoost,
  };
}

/**
 * Find wardrobe items that match an outfit photo
 */
export async function findMatchingItems(
  outfitPhotoUrl: string,
  wardrobeItems: WardrobeItem[],
  options: {
    minThreshold?: number; // Minimum similarity to be considered (default 0.60)
    maxResults?: number; // Max matches to return (default: all above threshold)
    maxPerConfidence?: {
      // Limit results per confidence level
      high?: number;
      medium?: number;
      low?: number;
    };
  } = {},
): Promise<ItemMatch[]> {
  const {
    minThreshold = 0.6, // Increased from 0.55 to reduce noise
    maxResults,
    maxPerConfidence = {
      high: 10,
      medium: 5,
      low: 3,
    },
  } = options;

  // Load learned preferences (or use defaults)
  const preferences = (await loadUserPreferences()) || getDefaultPreferences();

  // Get embedding for outfit photo
  const outfitEmbedding = await getImageEmbedding(outfitPhotoUrl);

  // Filter items that have embeddings
  const itemsWithEmbeddings = wardrobeItems.filter((item) => item.embedding);

  if (itemsWithEmbeddings.length === 0) {
    throw new Error('No items have embeddings. Please generate embeddings first.');
  }

  // Calculate similarity for each item with metadata boosting
  const matches: ItemMatch[] = itemsWithEmbeddings
    .map((item) => {
      const baseSimilarity = cosineSimilarity(outfitEmbedding, item.embedding!);

      // Apply metadata-based boosting with learned preferences
      const { boostedScore, boost } = boostScore(baseSimilarity, item, wardrobeItems, preferences);

      const percentage = Math.round(boostedScore * 100);

      // Use learned confidence thresholds
      let confidence: 'high' | 'medium' | 'low';
      if (boostedScore >= preferences.highConfidenceThreshold) confidence = 'high';
      else if (boostedScore >= preferences.mediumConfidenceThreshold) confidence = 'medium';
      else confidence = 'low';

      return {
        item,
        similarity: boostedScore,
        baseSimilarity,
        boost,
        percentage,
        confidence,
      };
    })
    .filter((match) => match.similarity >= minThreshold)
    .sort((a, b) => b.similarity - a.similarity);

  // Apply per-confidence limits
  const limitedMatches: ItemMatch[] = [];
  const grouped = {
    high: matches.filter((m) => m.confidence === 'high'),
    medium: matches.filter((m) => m.confidence === 'medium'),
    low: matches.filter((m) => m.confidence === 'low'),
  };

  if (maxPerConfidence.high) {
    limitedMatches.push(...grouped.high.slice(0, maxPerConfidence.high));
  }
  if (maxPerConfidence.medium) {
    limitedMatches.push(...grouped.medium.slice(0, maxPerConfidence.medium));
  }
  if (maxPerConfidence.low) {
    limitedMatches.push(...grouped.low.slice(0, maxPerConfidence.low));
  }

  // Re-sort combined results
  limitedMatches.sort((a, b) => b.similarity - a.similarity);

  // Apply overall max results if requested
  return maxResults ? limitedMatches.slice(0, maxResults) : limitedMatches;
}
