import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { isBefore, subDays } from "date-fns";
import type { NewWardrobeItem, WardrobeItem } from "../types/wardrobe";
import { countWearsInRange } from "../utils/dateFormatter";
import { saveItem } from "../utils/indexedDB";
import { generateId, loadItems, removeItem } from "../utils/storage";

interface WardrobeContextValue {
  items: WardrobeItem[];
  addItem: (newItem: NewWardrobeItem) => Promise<WardrobeItem>;
  updateItem: (id: string, updates: Partial<WardrobeItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  incrementWearCount: (id: string) => Promise<void>;
  getItemById: (id: string) => WardrobeItem | undefined;
  getItemsByCategory: (category: string) => WardrobeItem[];
  getAllBrands: () => string[];
  getLastWornDate: (id: string) => Date | undefined;
  getItemsWornInPeriod: (
    startDate: Date,
    endDate?: Date
  ) => Array<{ item: WardrobeItem; wearCount: number }>;
  getMostWornItems: (
    limit?: number,
    startDate?: Date
  ) => Array<{ item: WardrobeItem; wearCount: number }>;
  getUnwornItems: (daysSince?: number) => WardrobeItem[];
  isLoading: boolean;
}

const WardrobeContext = createContext<WardrobeContextValue | undefined>(
  undefined
);

interface WardrobeProviderProps {
  children: ReactNode;
}

export function WardrobeProvider({ children }: WardrobeProviderProps) {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load items from IndexedDB on mount
  useEffect(() => {
    async function initializeData() {
      try {
        const loadedItems = await loadItems();
        // Ensure backwards compatibility: add empty wearHistory if missing
        const itemsWithHistory = loadedItems.map((item) => ({
          ...item,
          wearHistory: item.wearHistory || [],
        }));
        setItems(itemsWithHistory);
      } catch (error) {
        console.error("Failed to load items:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeData();
  }, []);

  const addItem = async (newItem: NewWardrobeItem): Promise<WardrobeItem> => {
    const now = new Date();
    const item: WardrobeItem = {
      ...newItem,
      id: generateId(),
      wearCount: newItem.wearCount ?? 0,
      wearHistory: [], // Initialize with empty wear history
      createdAt: now,
      updatedAt: now,
    };

    // Save to IndexedDB first
    await saveItem(item);

    // Then update state
    setItems((prev) => [item, ...prev]);
    return item;
  };

  const updateItem = async (
    id: string,
    updates: Partial<WardrobeItem>
  ): Promise<void> => {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      throw new Error("Item not found");
    }

    const updatedItem = { ...itemToUpdate, ...updates, updatedAt: new Date() };

    // Save to IndexedDB first
    await saveItem(updatedItem);

    // Then update state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item))
    );
  };

  const deleteItem = async (id: string): Promise<void> => {
    // Delete from IndexedDB first
    await removeItem(id);

    // Then update state
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const incrementWearCount = async (id: string): Promise<void> => {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      throw new Error("Item not found");
    }

    const now = new Date();
    const updatedItem = {
      ...itemToUpdate,
      wearCount: itemToUpdate.wearCount + 1,
      wearHistory: [...(itemToUpdate.wearHistory || []), now], // Add current date to wear history
      updatedAt: now,
    };

    // Save to IndexedDB first
    await saveItem(updatedItem);

    // Then update state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item))
    );
  };

  const getItemById = (id: string): WardrobeItem | undefined => {
    return items.find((item) => item.id === id);
  };

  const getItemsByCategory = (category: string): WardrobeItem[] => {
    return items.filter((item) => item.category === category);
  };

  const getAllBrands = (): string[] => {
    const brands = new Set<string>();
    for (const item of items) {
      if (item.brand?.trim()) {
        brands.add(item.brand.trim());
      }
    }
    return Array.from(brands).sort();
  };

  const getLastWornDate = (id: string): Date | undefined => {
    const item = items.find((item) => item.id === id);
    if (!item || !item.wearHistory || item.wearHistory.length === 0) {
      return undefined;
    }
    // Return the most recent wear date
    return item.wearHistory.at(-1);
  };

  // Get items worn within a specific time period with their wear counts
  const getItemsWornInPeriod = (
    startDate: Date,
    endDate: Date = new Date()
  ): Array<{ item: WardrobeItem; wearCount: number }> => {
    return items
      .map((item) => ({
        item,
        wearCount: countWearsInRange(item.wearHistory, startDate, endDate),
      }))
      .filter((entry) => entry.wearCount > 0)
      .sort((a, b) => b.wearCount - a.wearCount);
  };

  // Get the most worn items (optionally within a time period)
  const getMostWornItems = (
    limit = 10,
    startDate?: Date
  ): Array<{ item: WardrobeItem; wearCount: number }> => {
    let itemsWithCounts;

    if (startDate) {
      // Filter by time period
      itemsWithCounts = getItemsWornInPeriod(startDate);
    } else {
      // Use total wear count
      itemsWithCounts = items
        .map((item) => ({
          item,
          wearCount: item.wearCount,
        }))
        .filter((entry) => entry.wearCount > 0)
        .sort((a, b) => b.wearCount - a.wearCount);
    }

    return itemsWithCounts.slice(0, limit);
  };

  // Get items that haven't been worn in X days (or never worn)
  const getUnwornItems = (daysSince = 365): WardrobeItem[] => {
    const cutoffDate = subDays(new Date(), daysSince);

    return items.filter((item) => {
      if (!item.wearHistory || item.wearHistory.length === 0) {
        return true; // Never worn
      }

      const lastWorn = item.wearHistory.at(-1);
      if (!lastWorn) return true; // Safety check

      return isBefore(new Date(lastWorn), cutoffDate);
    });
  };

  const value: WardrobeContextValue = {
    items,
    addItem,
    updateItem,
    deleteItem,
    incrementWearCount,
    getItemById,
    getItemsByCategory,
    getAllBrands,
    getLastWornDate,
    getItemsWornInPeriod,
    getMostWornItems,
    getUnwornItems,
    isLoading,
  };

  return (
    <WardrobeContext.Provider value={value}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe(): WardrobeContextValue {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error("useWardrobe must be used within a WardrobeProvider");
  }
  return context;
}
