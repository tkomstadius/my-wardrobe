import { useEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router';

/**
 * In-app back navigation that returns to where you came from, rather than a fixed parent page.
 *
 * The browser doesn't expose its history entries, so we mirror the in-app ones here (keyed by
 * React Router's location.key) to be able to skip entries that shouldn't be returned to.
 */

interface HistoryEntry {
  key: string;
  pathname: string;
}

// Form pages — once left (saved or abandoned), going "back" should never reopen them
const SKIPPED_PATHS = [/^\/edit-item\//, /^\/edit-outfit\//, /^\/add-item$/, /^\/create-outfit$/];

let entries: HistoryEntry[] = [];
let cursor = -1;

/** Call once in the layout so every in-app navigation is recorded. */
export function useTrackHistory() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // biome-ignore lint/correctness/useExhaustiveDependencies: location.key identifies each navigation
  useEffect(() => {
    const entry = { key: location.key, pathname: location.pathname };
    // Effects can re-run for the same navigation (e.g. StrictMode) — record it only once
    if (entries[cursor]?.key === entry.key) return;

    if (navigationType === 'PUSH') {
      entries = [...entries.slice(0, cursor + 1), entry];
      cursor = entries.length - 1;
    } else if (navigationType === 'REPLACE') {
      entries[Math.max(cursor, 0)] = entry;
      cursor = Math.max(cursor, 0);
    } else {
      // POP: browser back/forward to a known entry, or a fresh page load
      const index = entries.findIndex((e) => e.key === entry.key);
      if (index >= 0) {
        cursor = index;
      } else {
        entries = [entry];
        cursor = 0;
      }
    }
  }, [location.key]);
}

/**
 * Returns a function that goes back to the previous page, skipping form pages and other copies
 * of the current page (e.g. the item page before and after an edit). Falls back to navigating to
 * `fallback` when there's no usable history, such as right after a reload.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return () => {
    for (let i = cursor - 1; i >= 0; i--) {
      const entry = entries[i];
      if (!entry) continue;
      const skip =
        entry.pathname === pathname ||
        SKIPPED_PATHS.some((pattern) => pattern.test(entry.pathname));
      if (!skip) {
        navigate(i - cursor);
        return;
      }
    }
    navigate(fallback);
  };
}
