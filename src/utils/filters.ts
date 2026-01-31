export type FilterType = 'all' | 'thrifted' | 'casual' | 'handmade' | 'recent' | 'most-worn';

// Filter constants
export const FILTER_ALL = 'all' as const;

// Single source of truth for filter definitions
export const FILTERS = [
  { id: FILTER_ALL, label: 'All', color: undefined },
  { id: 'thrifted' as const, label: 'Thrifted', color: 'amber' as const },
  { id: 'casual' as const, label: 'Casual', color: 'cyan' as const },
  { id: 'handmade' as const, label: 'Handmade', color: 'green' as const },
  { id: 'recent' as const, label: 'Recent', color: 'purple' as const },
  { id: 'most-worn' as const, label: 'Most Worn', color: 'blue' as const },
] as const;

// Extract just the filter IDs for validation
export const FILTER_IDS = FILTERS.map((filter) => filter.id) as FilterType[];
