/**
 * AI Learning & Feedback System
 * Tracks user acceptance/rejection of AI suggestions to improve matching over time
 */

import { differenceInDays } from 'date-fns';
import type { ItemCategory } from '../types/wardrobe';
import { getCurrentUserId, supabase } from './supabase';

/**
 * Feedback record for each AI suggestion
 */
export interface MatchFeedback {
  id: string; // unique ID
  timestamp: Date;
  outfitPhotoHash: string; // Hash of outfit photo to group feedback

  // The suggestion details
  suggestedItemId: string;
  baseSimilarity: number;
  boostedSimilarity: number;
  confidence: 'high' | 'medium' | 'low';

  // User action
  userAction: 'accepted' | 'rejected';

  // Context at time of suggestion
  metadata: {
    category: ItemCategory;
    brand?: string;
    wearCount: number;
    itemAge: number; // days since item was added
    daysSinceWorn?: number; // days since last worn
  };
}

/**
 * User's learned preferences
 */
export interface UserPreferences {
  // Learned weights (start at 1.0, adjust based on feedback)
  categoryMatchWeight: number;
  brandMatchWeight: number;
  recencyWeight: number;
  wearFrequencyWeight: number;

  // Confidence thresholds (personalized over time)
  highConfidenceThreshold: number; // default 0.78
  mediumConfidenceThreshold: number; // default 0.68

  // Metadata
  totalFeedbackCount: number;
  lastUpdated: Date;
  version: number; // For future migrations
}

/**
 * Default preferences (no learning yet)
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    categoryMatchWeight: 1.0,
    brandMatchWeight: 1.0,
    recencyWeight: 1.0,
    wearFrequencyWeight: 1.0,
    highConfidenceThreshold: 0.78,
    mediumConfidenceThreshold: 0.68,
    totalFeedbackCount: 0,
    lastUpdated: new Date(),
    version: 1,
  };
}

// ========== DB Access (Supabase) ==========

function mapRowToFeedback(row: Record<string, unknown>): MatchFeedback {
  return {
    id: row.id as string,
    timestamp: new Date(row.timestamp as string),
    outfitPhotoHash: (row.outfit_photo_hash as string) ?? '',
    suggestedItemId: (row.suggested_item_id as string) ?? '',
    baseSimilarity: (row.base_similarity as number) ?? 0,
    boostedSimilarity: (row.boosted_similarity as number) ?? 0,
    confidence: (row.confidence as 'high' | 'medium' | 'low') ?? 'low',
    userAction: (row.user_action as 'accepted' | 'rejected') ?? 'rejected',
    metadata: (row.metadata as MatchFeedback['metadata']) ?? {
      category: 'tops' as ItemCategory,
      wearCount: 0,
      itemAge: 0,
    },
  };
}

/**
 * Save feedback for an AI suggestion
 */
export async function saveFeedback(feedback: MatchFeedback): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase.from('match_feedback').upsert({
    id: feedback.id,
    timestamp: feedback.timestamp.toISOString(),
    outfit_photo_hash: feedback.outfitPhotoHash,
    suggested_item_id: feedback.suggestedItemId,
    base_similarity: feedback.baseSimilarity,
    boosted_similarity: feedback.boostedSimilarity,
    confidence: feedback.confidence,
    user_action: feedback.userAction,
    metadata: feedback.metadata,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to save feedback: ${error.message}`);
  }
}

/**
 * Load all feedback records
 */
export async function loadAllFeedback(): Promise<MatchFeedback[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase.from('match_feedback').select('*').eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to load feedback: ${error.message}`);
  }

  return (data ?? []).map(mapRowToFeedback);
}

/**
 * Load feedback for a specific item
 */
export async function loadFeedbackForItem(itemId: string): Promise<MatchFeedback[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('match_feedback')
    .select('*')
    .eq('user_id', userId)
    .eq('suggested_item_id', itemId);

  if (error) {
    throw new Error(`Failed to load feedback for item: ${error.message}`);
  }

  return (data ?? []).map(mapRowToFeedback);
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(preferences: UserPreferences): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase.from('user_preferences').upsert({
    id: 'default',
    category_match_weight: preferences.categoryMatchWeight,
    brand_match_weight: preferences.brandMatchWeight,
    recency_weight: preferences.recencyWeight,
    wear_frequency_weight: preferences.wearFrequencyWeight,
    high_confidence_threshold: preferences.highConfidenceThreshold,
    medium_confidence_threshold: preferences.mediumConfidenceThreshold,
    total_feedback_count: preferences.totalFeedbackCount,
    last_updated: preferences.lastUpdated.toISOString(),
    version: preferences.version,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to save preferences: ${error.message}`);
  }
}

/**
 * Load user preferences
 */
export async function loadUserPreferences(): Promise<UserPreferences | null> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('id', 'default')
    .single();

  if (error) {
    // PGRST116 = no rows found, which is expected for new users
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to load preferences: ${error.message}`);
  }

  if (!data) return null;

  return {
    categoryMatchWeight: (data.category_match_weight as number) ?? 1.0,
    brandMatchWeight: (data.brand_match_weight as number) ?? 1.0,
    recencyWeight: (data.recency_weight as number) ?? 1.0,
    wearFrequencyWeight: (data.wear_frequency_weight as number) ?? 1.0,
    highConfidenceThreshold: (data.high_confidence_threshold as number) ?? 0.78,
    mediumConfidenceThreshold: (data.medium_confidence_threshold as number) ?? 0.68,
    totalFeedbackCount: (data.total_feedback_count as number) ?? 0,
    lastUpdated: new Date(data.last_updated as string),
    version: (data.version as number) ?? 1,
  };
}

/**
 * Clear all feedback (for reset)
 */
export async function clearAllFeedback(): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase.from('match_feedback').delete().eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to clear feedback: ${error.message}`);
  }
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(): Promise<void> {
  await saveUserPreferences(getDefaultPreferences());
}

// ========== Learning Algorithm (unchanged) ==========

/**
 * Calculate time-based weight for feedback
 * Recent feedback = 1.0, older feedback decays exponentially
 */
function calculateTimeWeight(timestamp: Date): number {
  const ageInDays = differenceInDays(new Date(), timestamp);
  // Exponential decay with 60-day half-life
  return Math.exp((-ageInDays * Math.LN2) / 60);
}

/**
 * Calculate weighted acceptance rate
 */
function calculateWeightedAcceptRate(feedback: MatchFeedback[]): {
  rate: number;
  totalWeight: number;
} {
  if (feedback.length === 0) return { rate: 0.5, totalWeight: 0 };

  let acceptedWeight = 0;
  let totalWeight = 0;

  for (const f of feedback) {
    const weight = calculateTimeWeight(f.timestamp);
    totalWeight += weight;
    if (f.userAction === 'accepted') {
      acceptedWeight += weight;
    }
  }

  return {
    rate: totalWeight > 0 ? acceptedWeight / totalWeight : 0.5,
    totalWeight,
  };
}

/**
 * Analyze feedback and update user preferences
 * This is the learning algorithm with time-weighted samples!
 */
export async function updatePreferencesFromFeedback(): Promise<UserPreferences> {
  const allFeedback = await loadAllFeedback();
  const preferences = (await loadUserPreferences()) || getDefaultPreferences();

  // Need minimum feedback to start learning
  if (allFeedback.length < 5) {
    console.log('Not enough feedback to learn yet (need at least 5)');
    return preferences;
  }

  // Calculate weighted acceptance rates for different factors
  const totalAccepted = allFeedback.filter((f) => f.userAction === 'accepted').length;
  const overallAcceptRate = totalAccepted / allFeedback.length;

  // Recency analysis: Do recently added items get accepted more? (weighted)
  const recentItemFeedback = allFeedback.filter((f) => f.metadata.itemAge < 30);
  const recentWeighted = calculateWeightedAcceptRate(recentItemFeedback);

  if (recentWeighted.rate > 0.7 && recentWeighted.totalWeight > 3) {
    preferences.recencyWeight = Math.min(preferences.recencyWeight * 1.05, 1.3);
  } else if (recentWeighted.rate < 0.4 && recentWeighted.totalWeight > 3) {
    preferences.recencyWeight = Math.max(preferences.recencyWeight * 0.95, 0.7);
  }

  // Wear frequency analysis: Do favorites get accepted more? (weighted)
  const favoriteItemFeedback = allFeedback.filter((f) => f.metadata.wearCount > 10);
  const favoriteWeighted = calculateWeightedAcceptRate(favoriteItemFeedback);

  if (favoriteWeighted.rate > 0.7 && favoriteWeighted.totalWeight > 3) {
    preferences.wearFrequencyWeight = Math.min(preferences.wearFrequencyWeight * 1.05, 1.3);
  } else if (favoriteWeighted.rate < 0.4 && favoriteWeighted.totalWeight > 3) {
    preferences.wearFrequencyWeight = Math.max(preferences.wearFrequencyWeight * 0.95, 0.7);
  }

  // Confidence threshold calibration (weighted)
  const highConfidenceFeedback = allFeedback.filter((f) => f.confidence === 'high');
  const highWeighted = calculateWeightedAcceptRate(highConfidenceFeedback);

  if (highWeighted.rate < 0.7 && highWeighted.totalWeight > 5) {
    preferences.highConfidenceThreshold = Math.min(
      preferences.highConfidenceThreshold + 0.01,
      0.85,
    );
  } else if (highWeighted.rate > 0.95 && highWeighted.totalWeight > 5) {
    preferences.highConfidenceThreshold = Math.max(
      preferences.highConfidenceThreshold - 0.005,
      0.75,
    );
  }

  // Medium confidence threshold (weighted)
  const mediumConfidenceFeedback = allFeedback.filter((f) => f.confidence === 'medium');
  const mediumWeighted = calculateWeightedAcceptRate(mediumConfidenceFeedback);

  if (mediumWeighted.rate > 0.8 && mediumWeighted.totalWeight > 5) {
    preferences.mediumConfidenceThreshold = Math.max(
      preferences.mediumConfidenceThreshold - 0.01,
      0.6,
    );
  } else if (mediumWeighted.rate < 0.5 && mediumWeighted.totalWeight > 5) {
    preferences.mediumConfidenceThreshold = Math.min(
      preferences.mediumConfidenceThreshold + 0.01,
      0.75,
    );
  }

  // Update metadata
  preferences.totalFeedbackCount = allFeedback.length;
  preferences.lastUpdated = new Date();

  // Save updated preferences
  await saveUserPreferences(preferences);

  console.log('Updated AI preferences from feedback:', {
    feedbackCount: allFeedback.length,
    overallAcceptRate: overallAcceptRate.toFixed(2),
    weightedRates: {
      recent: recentWeighted.rate.toFixed(2),
      favorites: favoriteWeighted.rate.toFixed(2),
      highConf: highWeighted.rate.toFixed(2),
      mediumConf: mediumWeighted.rate.toFixed(2),
    },
    preferences,
  });

  return preferences;
}

/**
 * Get feedback statistics for display
 */
export async function getFeedbackStats(): Promise<{
  totalFeedback: number;
  acceptedCount: number;
  rejectedCount: number;
  acceptanceRate: number;
  confidenceAccuracy: {
    high: { total: number; accepted: number; rate: number };
    medium: { total: number; accepted: number; rate: number };
    low: { total: number; accepted: number; rate: number };
  };
}> {
  const allFeedback = await loadAllFeedback();
  const accepted = allFeedback.filter((f) => f.userAction === 'accepted');

  const highConf = allFeedback.filter((f) => f.confidence === 'high');
  const mediumConf = allFeedback.filter((f) => f.confidence === 'medium');
  const lowConf = allFeedback.filter((f) => f.confidence === 'low');

  return {
    totalFeedback: allFeedback.length,
    acceptedCount: accepted.length,
    rejectedCount: allFeedback.length - accepted.length,
    acceptanceRate: allFeedback.length > 0 ? accepted.length / allFeedback.length : 0,
    confidenceAccuracy: {
      high: {
        total: highConf.length,
        accepted: highConf.filter((f) => f.userAction === 'accepted').length,
        rate:
          highConf.length > 0
            ? highConf.filter((f) => f.userAction === 'accepted').length / highConf.length
            : 0,
      },
      medium: {
        total: mediumConf.length,
        accepted: mediumConf.filter((f) => f.userAction === 'accepted').length,
        rate:
          mediumConf.length > 0
            ? mediumConf.filter((f) => f.userAction === 'accepted').length / mediumConf.length
            : 0,
      },
      low: {
        total: lowConf.length,
        accepted: lowConf.filter((f) => f.userAction === 'accepted').length,
        rate:
          lowConf.length > 0
            ? lowConf.filter((f) => f.userAction === 'accepted').length / lowConf.length
            : 0,
      },
    },
  };
}

/**
 * Generate a simple hash for an image data URL
 * Used to group feedback by outfit photo
 */
export function hashImageData(imageDataURL: string): string {
  const start = imageDataURL.substring(0, 100);
  const end = imageDataURL.substring(imageDataURL.length - 100);
  return `${imageDataURL.length}-${btoa(start + end).substring(0, 32)}`;
}
