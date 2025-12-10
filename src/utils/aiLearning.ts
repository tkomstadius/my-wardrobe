/**
 * AI Learning & Feedback System
 * Tracks user acceptance/rejection of AI suggestions to improve matching over time
 */

import { differenceInDays } from "date-fns";
import type { ItemCategory } from "../types/wardrobe";

const DB_NAME = "MyWardrobeDB";
const FEEDBACK_STORE = "matchFeedback";
const PREFERENCES_STORE = "userPreferences";

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
  confidence: "high" | "medium" | "low";

  // User action
  userAction: "accepted" | "rejected";

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

/**
 * Open database with feedback stores
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 4); // Bump to version 4

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create feedback store if it doesn't exist
      if (!db.objectStoreNames.contains(FEEDBACK_STORE)) {
        const feedbackStore = db.createObjectStore(FEEDBACK_STORE, {
          keyPath: "id",
        });
        feedbackStore.createIndex("timestamp", "timestamp", { unique: false });
        feedbackStore.createIndex("suggestedItemId", "suggestedItemId", {
          unique: false,
        });
        feedbackStore.createIndex("userAction", "userAction", {
          unique: false,
        });
        feedbackStore.createIndex("outfitPhotoHash", "outfitPhotoHash", {
          unique: false,
        });
      }

      // Create preferences store if it doesn't exist
      if (!db.objectStoreNames.contains(PREFERENCES_STORE)) {
        db.createObjectStore(PREFERENCES_STORE, { keyPath: "id" });
      }
    };
  });
}

/**
 * Save feedback for an AI suggestion
 */
export async function saveFeedback(feedback: MatchFeedback): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], "readwrite");
    const store = transaction.objectStore(FEEDBACK_STORE);

    const dbFeedback = {
      ...feedback,
      timestamp: feedback.timestamp.toISOString(),
    };

    const request = store.put(dbFeedback);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load all feedback records
 */
export async function loadAllFeedback(): Promise<MatchFeedback[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], "readonly");
    const store = transaction.objectStore(FEEDBACK_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const dbFeedback = request.result;
      const feedback = dbFeedback.map((fb) => ({
        ...fb,
        timestamp: new Date(fb.timestamp),
      }));
      resolve(feedback);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load feedback for a specific item
 */
export async function loadFeedbackForItem(
  itemId: string
): Promise<MatchFeedback[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], "readonly");
    const store = transaction.objectStore(FEEDBACK_STORE);
    const index = store.index("suggestedItemId");
    const request = index.getAll(itemId);

    request.onsuccess = () => {
      const dbFeedback = request.result;
      const feedback = dbFeedback.map((fb) => ({
        ...fb,
        timestamp: new Date(fb.timestamp),
      }));
      resolve(feedback);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(
  preferences: UserPreferences
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PREFERENCES_STORE], "readwrite");
    const store = transaction.objectStore(PREFERENCES_STORE);

    const dbPreferences = {
      id: "default", // Single preferences record
      ...preferences,
      lastUpdated: preferences.lastUpdated.toISOString(),
    };

    const request = store.put(dbPreferences);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Load user preferences
 */
export async function loadUserPreferences(): Promise<UserPreferences | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PREFERENCES_STORE], "readonly");
    const store = transaction.objectStore(PREFERENCES_STORE);
    const request = store.get("default");

    request.onsuccess = () => {
      const dbPreferences = request.result;
      if (!dbPreferences) {
        resolve(null);
      } else {
        resolve({
          ...dbPreferences,
          lastUpdated: new Date(dbPreferences.lastUpdated),
        });
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Clear all feedback (for reset)
 */
export async function clearAllFeedback(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FEEDBACK_STORE], "readwrite");
    const store = transaction.objectStore(FEEDBACK_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(): Promise<void> {
  await saveUserPreferences(getDefaultPreferences());
}

/**
 * Calculate time-based weight for feedback
 * Recent feedback = 1.0, older feedback decays exponentially
 */
function calculateTimeWeight(timestamp: Date): number {
  // Use date-fns for accurate day calculations (handles DST, timezones, etc.)
  const ageInDays = differenceInDays(new Date(), timestamp);

  // Exponential decay with 60-day half-life
  // Today: 1.0, 60 days ago: 0.5, 120 days ago: 0.25
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
    if (f.userAction === "accepted") {
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
    console.log("Not enough feedback to learn yet (need at least 5)");
    return preferences;
  }

  // Calculate weighted acceptance rates for different factors
  const totalAccepted = allFeedback.filter(
    (f) => f.userAction === "accepted"
  ).length;
  const overallAcceptRate = totalAccepted / allFeedback.length;

  // Recency analysis: Do recently added items get accepted more? (weighted)
  const recentItemFeedback = allFeedback.filter((f) => f.metadata.itemAge < 30);
  const recentWeighted = calculateWeightedAcceptRate(recentItemFeedback);

  // If recent items are accepted at high rate, increase recency weight
  // Use weighted rate (recent feedback influences more)
  if (recentWeighted.rate > 0.7 && recentWeighted.totalWeight > 3) {
    preferences.recencyWeight = Math.min(preferences.recencyWeight * 1.05, 1.3);
  } else if (recentWeighted.rate < 0.4 && recentWeighted.totalWeight > 3) {
    preferences.recencyWeight = Math.max(preferences.recencyWeight * 0.95, 0.7);
  }

  // Wear frequency analysis: Do favorites get accepted more? (weighted)
  const favoriteItemFeedback = allFeedback.filter(
    (f) => f.metadata.wearCount > 10
  );
  const favoriteWeighted = calculateWeightedAcceptRate(favoriteItemFeedback);

  if (favoriteWeighted.rate > 0.7 && favoriteWeighted.totalWeight > 3) {
    preferences.wearFrequencyWeight = Math.min(
      preferences.wearFrequencyWeight * 1.05,
      1.3
    );
  } else if (favoriteWeighted.rate < 0.4 && favoriteWeighted.totalWeight > 3) {
    preferences.wearFrequencyWeight = Math.max(
      preferences.wearFrequencyWeight * 0.95,
      0.7
    );
  }

  // Confidence threshold calibration (weighted)
  // If high confidence suggestions are often rejected, raise the threshold
  const highConfidenceFeedback = allFeedback.filter(
    (f) => f.confidence === "high"
  );
  const highWeighted = calculateWeightedAcceptRate(highConfidenceFeedback);

  if (highWeighted.rate < 0.7 && highWeighted.totalWeight > 5) {
    // High confidence not reliable enough - raise threshold
    preferences.highConfidenceThreshold = Math.min(
      preferences.highConfidenceThreshold + 0.01,
      0.85
    );
  } else if (highWeighted.rate > 0.95 && highWeighted.totalWeight > 5) {
    // High confidence very reliable - can lower threshold slightly
    preferences.highConfidenceThreshold = Math.max(
      preferences.highConfidenceThreshold - 0.005,
      0.75
    );
  }

  // Medium confidence threshold (weighted)
  const mediumConfidenceFeedback = allFeedback.filter(
    (f) => f.confidence === "medium"
  );
  const mediumWeighted = calculateWeightedAcceptRate(mediumConfidenceFeedback);

  if (mediumWeighted.rate > 0.8 && mediumWeighted.totalWeight > 5) {
    // Medium confidence very reliable - can lower threshold
    preferences.mediumConfidenceThreshold = Math.max(
      preferences.mediumConfidenceThreshold - 0.01,
      0.6
    );
  } else if (mediumWeighted.rate < 0.5 && mediumWeighted.totalWeight > 5) {
    // Medium confidence not reliable - raise threshold
    preferences.mediumConfidenceThreshold = Math.min(
      preferences.mediumConfidenceThreshold + 0.01,
      0.75
    );
  }

  // Update metadata
  preferences.totalFeedbackCount = allFeedback.length;
  preferences.lastUpdated = new Date();

  // Save updated preferences
  await saveUserPreferences(preferences);

  console.log("✨ Updated AI preferences from feedback:", {
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
  const accepted = allFeedback.filter((f) => f.userAction === "accepted");

  const highConf = allFeedback.filter((f) => f.confidence === "high");
  const mediumConf = allFeedback.filter((f) => f.confidence === "medium");
  const lowConf = allFeedback.filter((f) => f.confidence === "low");

  return {
    totalFeedback: allFeedback.length,
    acceptedCount: accepted.length,
    rejectedCount: allFeedback.length - accepted.length,
    acceptanceRate:
      allFeedback.length > 0 ? accepted.length / allFeedback.length : 0,
    confidenceAccuracy: {
      high: {
        total: highConf.length,
        accepted: highConf.filter((f) => f.userAction === "accepted").length,
        rate:
          highConf.length > 0
            ? highConf.filter((f) => f.userAction === "accepted").length /
              highConf.length
            : 0,
      },
      medium: {
        total: mediumConf.length,
        accepted: mediumConf.filter((f) => f.userAction === "accepted").length,
        rate:
          mediumConf.length > 0
            ? mediumConf.filter((f) => f.userAction === "accepted").length /
              mediumConf.length
            : 0,
      },
      low: {
        total: lowConf.length,
        accepted: lowConf.filter((f) => f.userAction === "accepted").length,
        rate:
          lowConf.length > 0
            ? lowConf.filter((f) => f.userAction === "accepted").length /
              lowConf.length
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
  // Simple hash: take length + first/last 100 chars
  const start = imageDataURL.substring(0, 100);
  const end = imageDataURL.substring(imageDataURL.length - 100);
  return `${imageDataURL.length}-${btoa(start + end).substring(0, 32)}`;
}
