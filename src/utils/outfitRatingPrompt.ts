/**
 * Utilities for outfit rating prompt
 * Finds all unrated outfits that should be prompted
 */

import { compareDesc } from 'date-fns';
import type { Outfit } from '../types/outfit';

const PROMPTED_OUTFITS_KEY = 'outfitRatingPrompt_promptedOutfits';

/**
 * Get list of outfit IDs that have been prompted (from localStorage)
 */
function getPromptedOutfitIds(): string[] {
  const promptedStr = localStorage.getItem(PROMPTED_OUTFITS_KEY);
  if (!promptedStr) return [];
  try {
    const parsed = JSON.parse(promptedStr) as string[];
    return Array.isArray(parsed) ? parsed : [];
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

  prompted.push(outfitId);
  localStorage.setItem(PROMPTED_OUTFITS_KEY, JSON.stringify(prompted));
}

/**
 * Check if an outfit was already prompted
 */
export function wasOutfitPrompted(outfitId: string): boolean {
  return getPromptedOutfitIds().includes(outfitId);
}

/**
 * Find all unrated outfits that haven't been prompted yet
 */
export function findUnratedOutfits(outfits?: Outfit[]): Outfit[] {
  if (!outfits) return [];

  return outfits
    .filter((outfit) => {
      // Must not have a rating
      if (outfit.rating !== undefined) return false;

      return true;
    })
    .sort((a, b) => compareDesc(a.createdAt, b.createdAt)); // Most recent first
}
