import { compareAsc } from "date-fns";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type {
  ItemCategory,
  NewWardrobeItem,
  WardrobeItem,
} from "../types/wardrobe";
import { saveItem } from "../utils/indexedDB";
import { generateId, loadItems, removeItem } from "../utils/storage";
import {
  getItemsWornInPeriod as getItemsWornInPeriodUtil,
  getUnwornItemsSince,
} from "../utils/wardrobeFilters";
import { getSubCategoriesForCategory as getSubCategoriesForCategoryUtil } from "../utils/categories";

interface WardrobeContextValue {
  items: WardrobeItem[];
  addItem: (newItem: NewWardrobeItem) => Promise<WardrobeItem>;
  updateItem: (id: string, updates: Partial<WardrobeItem>) => Promise<void>;
  updateItemEmbedding: (id: string, embedding: number[]) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  incrementWearCount: (id: string) => Promise<number>;
  logWearOnDate: (id: string, date: Date) => Promise<void>;
  removeWear: (id: string, wearIndex: number) => Promise<void>;
  getItemById: (id: string) => WardrobeItem | undefined;
  getItemsByCategory: (
    category: string,
    subCategory?: string
  ) => WardrobeItem[];
  getAllBrands: () => string[];
  getAllSubCategories: () => string[];
  getSubCategoriesForCategory: (category: ItemCategory) => readonly string[];
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
        setItems(loadedItems);
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
    const initialWearCount = newItem.initialWearCount ?? 0;
    const item: WardrobeItem = {
      ...newItem,
      id: generateId(),
      initialWearCount,
      wearCount: initialWearCount, // Start with initial count (will increase as worn in app)
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

  const updateItemEmbedding = async (
    id: string,
    embedding: number[]
  ): Promise<void> => {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      throw new Error("Item not found");
    }

    const updatedItem = {
      ...itemToUpdate,
      embedding,
      updatedAt: new Date(),
    };

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

  const incrementWearCount = async (id: string): Promise<number> => {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      throw new Error("Item not found");
    }

    const now = new Date();
    const newWearHistory = [...(itemToUpdate.wearHistory || []), now];
    const initialCount = itemToUpdate.initialWearCount ?? 0;

    const updatedItem = {
      ...itemToUpdate,
      wearCount: initialCount + newWearHistory.length, // Calculate total: initial + history
      wearHistory: newWearHistory, // Add current date to wear history
      updatedAt: now,
    };

    // Save to IndexedDB first
    await saveItem(updatedItem);

    // Then update state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item))
    );

    return updatedItem.wearCount;
  };

  const logWearOnDate = async (id: string, date: Date): Promise<void> => {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      throw new Error("Item not found");
    }

    // Add the new date to wear history and sort chronologically using date-fns
    const newWearHistory = [...(itemToUpdate.wearHistory || []), date].sort(
      compareAsc
    );
    const initialCount = itemToUpdate.initialWearCount ?? 0;

    const updatedItem = {
      ...itemToUpdate,
      wearCount: initialCount + newWearHistory.length, // Calculate total: initial + history
      wearHistory: newWearHistory, // Add specified date to wear history (sorted)
      updatedAt: new Date(),
    };

    // Save to IndexedDB first
    await saveItem(updatedItem);

    // Then update state
    setItems((prev) =>
      prev.map((item) => (item.id === id ? updatedItem : item))
    );
  };

  const removeWear = async (id: string, wearIndex: number): Promise<void> => {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      throw new Error("Item not found");
    }

    const newWearHistory = [...(itemToUpdate.wearHistory || [])];

    // Remove the wear at the specified index
    if (wearIndex < 0 || wearIndex >= newWearHistory.length) {
      throw new Error("Invalid wear index");
    }

    newWearHistory.splice(wearIndex, 1);
    const initialCount = itemToUpdate.initialWearCount ?? 0;

    const updatedItem = {
      ...itemToUpdate,
      wearCount: initialCount + newWearHistory.length, // Recalculate total
      wearHistory: newWearHistory,
      updatedAt: new Date(),
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

  const getItemsByCategory = (
    category: string,
    subCategory?: string
  ): WardrobeItem[] => {
    return items.filter((item) => {
      if (item.category !== category) return false;
      if (subCategory !== undefined) {
        return item.subCategory === subCategory;
      }
      return true;
    });
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

  const getAllSubCategories = (): string[] => {
    const subCategories = new Set<string>();
    for (const item of items) {
      if (item.subCategory?.trim()) {
        subCategories.add(item.subCategory.trim());
      }
    }
    return Array.from(subCategories).sort();
  };

  const getSubCategoriesForCategory = (
    category: ItemCategory
  ): readonly string[] => {
    return getSubCategoriesForCategoryUtil(category);
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
    return getItemsWornInPeriodUtil(items, startDate, endDate);
  };

  // Get the most worn items (optionally within a time period)
  const getMostWornItems = (
    limit = 10,
    startDate?: Date
  ): Array<{ item: WardrobeItem; wearCount: number }> => {
    let itemsWithCounts: Array<{ item: WardrobeItem; wearCount: number }>;

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
    if (daysSince === 365) {
      // Return items that have never been worn
      return items.filter(
        (item) => !item.wearHistory || item.wearHistory.length === 0
      );
    }

    return getUnwornItemsSince(items, daysSince);
  };

  const value: WardrobeContextValue = {
    items,
    addItem,
    updateItem,
    updateItemEmbedding,
    deleteItem,
    incrementWearCount,
    logWearOnDate,
    removeWear,
    getItemById,
    getItemsByCategory,
    getAllBrands,
    getAllSubCategories,
    getSubCategoriesForCategory,
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
