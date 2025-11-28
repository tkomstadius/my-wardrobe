import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import type { NewWardrobeItem, WardrobeItem } from '../types/wardrobe';
import { saveItem } from '../utils/indexedDB';
import { generateId, loadItems, removeItem } from '../utils/storage';

interface WardrobeContextValue {
  items: WardrobeItem[];
  addItem: (newItem: NewWardrobeItem) => Promise<WardrobeItem>;
  updateItem: (id: string, updates: Partial<WardrobeItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemById: (id: string) => WardrobeItem | undefined;
  getItemsByCategory: (category: string) => WardrobeItem[];
  isLoading: boolean;
}

const WardrobeContext = createContext<WardrobeContextValue | undefined>(undefined);

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
        console.error('Failed to load items:', error);
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
      wearCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Save to IndexedDB first
    await saveItem(item);

    // Then update state
    setItems((prev) => [item, ...prev]);
    return item;
  };

  const updateItem = async (id: string, updates: Partial<WardrobeItem>): Promise<void> => {
    const itemToUpdate = items.find((item) => item.id === id);
    if (!itemToUpdate) {
      throw new Error('Item not found');
    }

    const updatedItem = { ...itemToUpdate, ...updates, updatedAt: new Date() };

    // Save to IndexedDB first
    await saveItem(updatedItem);

    // Then update state
    setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)));
  };

  const deleteItem = async (id: string): Promise<void> => {
    // Delete from IndexedDB first
    await removeItem(id);

    // Then update state
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getItemById = (id: string): WardrobeItem | undefined => {
    return items.find((item) => item.id === id);
  };

  const getItemsByCategory = (category: string): WardrobeItem[] => {
    return items.filter((item) => item.category === category);
  };

  const value: WardrobeContextValue = {
    items,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getItemsByCategory,
    isLoading,
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe(): WardrobeContextValue {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
}
