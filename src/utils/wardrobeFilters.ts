import { isSameDay } from "date-fns";
import type { WardrobeItem } from "../types/wardrobe";
import { getDaysAgo, countWearsInRange } from "./dateFormatter";

export function getItemsWornOnDate(
  items: WardrobeItem[],
  targetDate: Date
): WardrobeItem[] {
  return items.filter(({ wearHistory }) => {
    const lastWorn = wearHistory?.at(-1);

    return lastWorn && isSameDay(new Date(lastWorn), targetDate);
  });
}

export function getItemsWornToday(items: WardrobeItem[]): WardrobeItem[] {
  return getItemsWornOnDate(items, new Date());
}

/**
 * Check if a single item was worn today
 */
export function isWornToday(item: WardrobeItem): boolean {
  if (!item.wearHistory || item.wearHistory.length === 0) {
    return false;
  }

  return getItemsWornOnDate([item], new Date()).length > 0;
}

/**
 * Get items worn in a date range with wear counts
 */
export function getItemsWornInPeriod(
  items: WardrobeItem[],
  startDate: Date,
  endDate: Date = new Date()
): Array<{ item: WardrobeItem; wearCount: number }> {
  return items
    .map((item) => ({
      item,
      wearCount: countWearsInRange(item.wearHistory, startDate, endDate),
    }))
    .filter((entry) => entry.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount);
}

/**
 * Get items that haven't been worn in a specified number of days
 */
export function getNeglectedItems(
  items: WardrobeItem[],
  daysThreshold = 30
): WardrobeItem[] {
  const thresholdDate = getDaysAgo(daysThreshold);

  return items
    .filter((item) => {
      // Never worn items are considered neglected
      if (!item.wearHistory || item.wearHistory.length === 0) {
        return true;
      }

      // Get the last worn date
      const lastWorn = item.wearHistory.at(-1);
      if (!lastWorn) {
        return true;
      }

      // Check if last worn date is before threshold
      return new Date(lastWorn) < thresholdDate;
    })
    .sort((a, b) => {
      // Sort by last worn date (oldest first)
      const dateA = a.wearHistory?.at(-1);
      const dateB = b.wearHistory?.at(-1);

      // Never worn items go last
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
}

/**
 * Get items that have never been worn
 */
export function getUnwornItems(items: WardrobeItem[]): WardrobeItem[] {
  return items.filter(
    (item) => !item.wearHistory || item.wearHistory.length === 0
  );
}

/**
 * Get items that haven't been worn in a specified number of days (excluding never worn)
 */
export function getUnwornItemsSince(
  items: WardrobeItem[],
  daysSince: number
): WardrobeItem[] {
  const thresholdDate = getDaysAgo(daysSince);

  return items.filter((item) => {
    // Exclude never worn items
    if (!item.wearHistory || item.wearHistory.length === 0) {
      return false;
    }

    const lastWorn = item.wearHistory.at(-1);
    if (!lastWorn) {
      return false;
    }

    return new Date(lastWorn) < thresholdDate;
  });
}
