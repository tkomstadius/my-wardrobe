// Format date according to ISO 8601 / Swedish standard (YYYY-MM-DD)
export function formatDate(date: Date | undefined): string {
  if (!date) return "";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Format date for display with Swedish locale
export function formatDateDisplay(date: Date | undefined): string {
  if (!date) return "";

  return new Date(date).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Get date X days ago from now
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Get date X months ago from now
export function getMonthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
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

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(lastWorn).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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
