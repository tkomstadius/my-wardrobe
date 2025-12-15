import {
  format,
  subDays,
  subMonths,
  subYears,
  differenceInCalendarDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";
import { sv } from "date-fns/locale";

// Format date according to ISO 8601 / Swedish standard (YYYY-MM-DD)
export function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

// Format date for display with Swedish locale
export function formatDateDisplay(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "d MMM yyyy", { locale: sv });
}

// Get date X days ago from now
export function getDaysAgo(days: number): Date {
  return subDays(new Date(), days);
}

// Get date X months ago from now
export function getMonthsAgo(months: number): Date {
  return subMonths(new Date(), months);
}

// Normalize a date to the start of the day (00:00:00.000)
export function normalizeToStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

// Check if two dates are on the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    normalizeToStartOfDay(date1).getTime() ===
    normalizeToStartOfDay(date2).getTime()
  );
}

// Count how many times an item was worn in a date range
export function countWearsInRange(
  wearHistory: Date[],
  startDate: Date,
  endDate: Date = new Date()
): number {
  if (!wearHistory || wearHistory.length === 0) return 0;

  return wearHistory.filter((wearDate) => {
    const date = new Date(wearDate);
    return date >= startDate && date <= endDate;
  }).length;
}

// Get the most recent wear date from wear history
export function getLastWornDate(wearHistory: Date[]): Date | undefined {
  if (!wearHistory || wearHistory.length === 0) return undefined;
  return wearHistory.at(-1);
}

// Get days since last worn
export function getDaysSinceLastWorn(wearHistory: Date[]): number | undefined {
  const lastWorn = getLastWornDate(wearHistory);
  if (!lastWorn) return undefined;

  return differenceInCalendarDays(new Date(), lastWorn);
}

// Format "last worn" display text (e.g., "2 days ago", "Last week", "3 months ago")
export function formatLastWorn(wearHistory: Date[]): string {
  const days = getDaysSinceLastWorn(wearHistory);

  if (days === undefined) return "Never worn";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "Last month";
  if (days < 365) return `${Math.floor(days / 30)} months ago`;

  return `${Math.floor(days / 365)} year${
    Math.floor(days / 365) > 1 ? "s" : ""
  } ago`;
}

// Calculate the age of an item from purchase date
export function calculateItemAge(purchaseDate: Date): {
  years: number;
  months: number;
  days: number;
} {
  const now = new Date();
  const years = differenceInYears(now, purchaseDate);
  const months = differenceInMonths(now, purchaseDate) % 12;

  // Get remaining days after accounting for years and months
  const afterYearsMonths = subMonths(subYears(now, years), months);
  const days = differenceInCalendarDays(afterYearsMonths, purchaseDate);

  return { years, months, days };
}

// Format item age as a compact string (e.g., "2y 3m", "6m 15d", "15d")
export function formatItemAge(purchaseDate: Date | undefined): string {
  if (!purchaseDate) return "";

  const { years, months, days } = calculateItemAge(purchaseDate);

  // Show years and months if item is over a year old
  if (years > 0) {
    if (months > 0) {
      return `${years}y ${months}m`;
    }
    return `${years}y`;
  }

  // Show months and days if item is over a month old
  if (months > 0) {
    if (days > 0) {
      return `${months}m ${days}d`;
    }
    return `${months}m`;
  }

  // Just show days for items less than a month old
  if (days === 0) {
    return "New today";
  }
  return `${days}d`;
}
