/**
 * Utilities for end-of-day outfit rating prompt
 * Checks if user should be prompted to rate an outfit
 */

import { isSameDay } from "./dateFormatter";
import type { Outfit } from "../types/outfit";

const PROMPT_TIME_THRESHOLD_HOUR = 18; // 6 PM
const LAST_PROMPT_DATE_KEY = "outfitRatingPrompt_lastPromptDate";
const PROMPTED_OUTFITS_KEY = "outfitRatingPrompt_promptedOutfits";

/**
 * Check if current time is after the threshold (e.g., 6 PM)
 */
export function isAfterPromptTime(): boolean {
  const now = new Date();
  return now.getHours() >= PROMPT_TIME_THRESHOLD_HOUR;
}

/**
 * Get the last date the user was prompted (from localStorage)
 */
export function getLastPromptDate(): Date | null {
  const lastPromptDateStr = localStorage.getItem(LAST_PROMPT_DATE_KEY);
  if (!lastPromptDateStr) return null;
  return new Date(lastPromptDateStr);
}

/**
 * Check if user was already prompted today
 */
export function wasPromptedToday(): boolean {
  const lastPromptDate = getLastPromptDate();
  if (!lastPromptDate) return false;
  return isSameDay(lastPromptDate, new Date());
}

/**
 * Mark that user was prompted today
 */
export function markPromptedToday(): void {
  localStorage.setItem(LAST_PROMPT_DATE_KEY, new Date().toISOString());
}

/**
 * Get list of outfit IDs that have been prompted (from localStorage)
 */
function getPromptedOutfitIds(): string[] {
  const promptedStr = localStorage.getItem(PROMPTED_OUTFITS_KEY);
  if (!promptedStr) return [];
  try {
    const parsed = JSON.parse(promptedStr) as { outfitId: string; date: string }[];
    // Filter out entries older than today
    const today = new Date();
    return parsed
      .filter((entry) => isSameDay(new Date(entry.date), today))
      .map((entry) => entry.outfitId);
  } catch {
    return [];
  }
}

/**
 * Mark an outfit as prompted
 */
export function markOutfitAsPrompted(outfitId: string): void {
  const prompted = getPromptedOutfitIds();
  if (prompted.includes(outfitId)) return;

  const existingStr = localStorage.getItem(PROMPTED_OUTFITS_KEY);
  let existing: { outfitId: string; date: string }[] = [];
  if (existingStr) {
    try {
      existing = JSON.parse(existingStr) as { outfitId: string; date: string }[];
      // Clean up old entries (older than today)
      const today = new Date();
      existing = existing.filter((entry) =>
        isSameDay(new Date(entry.date), today)
      );
    } catch {
      existing = [];
    }
  }

  existing.push({ outfitId, date: new Date().toISOString() });
  localStorage.setItem(PROMPTED_OUTFITS_KEY, JSON.stringify(existing));
}

/**
 * Check if an outfit was already prompted
 */
export function wasOutfitPrompted(outfitId: string): boolean {
  return getPromptedOutfitIds().includes(outfitId);
}

/**
 * Find an outfit from today that hasn't been rated yet and hasn't been prompted
 */
export function findUnratedOutfitFromToday(
  outfits: Outfit[]
): Outfit | undefined {
  const today = new Date();
  const promptedIds = getPromptedOutfitIds();

  return outfits.find((outfit) => {
    // Must be from today
    if (!isSameDay(outfit.createdAt, today)) return false;

    // Must not have a rating
    if (outfit.rating !== undefined) return false;

    // Must not have been prompted already
    if (promptedIds.includes(outfit.id)) return false;

    return true;
  });
}

/**
 * Check if rating prompt should be shown
 */
export function shouldShowRatingPrompt(outfits: Outfit[]): {
  shouldShow: boolean;
  outfit?: Outfit;
} {
  // Check if it's after the threshold time
  if (!isAfterPromptTime()) {
    return { shouldShow: false };
  }

  // Check if user was already prompted today (general check)
  if (wasPromptedToday()) {
    // Still check if there's a specific outfit that hasn't been prompted
    const unratedOutfit = findUnratedOutfitFromToday(outfits);
    if (unratedOutfit) {
      return { shouldShow: true, outfit: unratedOutfit };
    }
    return { shouldShow: false };
  }

  // Find an unrated outfit from today
  const unratedOutfit = findUnratedOutfitFromToday(outfits);
  if (unratedOutfit) {
    return { shouldShow: true, outfit: unratedOutfit };
  }

  return { shouldShow: false };
}

