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

