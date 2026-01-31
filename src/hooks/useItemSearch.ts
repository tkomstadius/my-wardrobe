import { useMemo, useState } from 'react';
import type { WardrobeItem } from '../types/wardrobe';

/**
 * Custom hook for searching wardrobe items
 * Searches across: category, brand, notes, and tags (thrifted, casual, handmade)
 * Supports multi-keyword search (e.g., "tops nike blue")
 */
export function useItemSearch(items: WardrobeItem[]) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase().trim();
    const keywords = query.split(/\s+/); // Split by whitespace for multi-keyword search

    return items.filter((item) => {
      // Create searchable text from item properties
      const searchableText = [
        item.category,
        item.brand,
        item.notes,
        item.isSecondHand ? 'thrifted secondhand' : '',
        item.isDogCasual ? 'casual dogcasual' : '',
        item.isHandmade ? 'handmade' : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Item matches if ALL keywords are found in searchable text
      return keywords.every((keyword) => searchableText.includes(keyword));
    });
  }, [items, searchQuery]);

  const clearSearch = () => setSearchQuery('');

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filteredItems,
    hasSearch: searchQuery.trim().length > 0,
  };
}
