import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { NewOutfit, Outfit } from "../types/outfit";
import { generateId, loadOutfits } from "../utils/storageCommands";

interface OutfitContextValue {
  outfits: Outfit[];
  addOutfit: (newOutfit: NewOutfit) => Promise<Outfit>;
  updateOutfit: (id: string, updates: Partial<Outfit>) => Promise<void>;
  getOutfitById: (id: string) => Outfit | undefined;
  getRecentOutfits: (limit?: number) => Outfit[];
  getOutfitsByItemId: (itemId: string) => Outfit[];
  isLoading: boolean;
}

const OutfitContext = createContext<OutfitContextValue | undefined>(undefined);

interface OutfitProviderProps {
  children: ReactNode;
}

export function OutfitProvider({ children }: OutfitProviderProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load outfits from IndexedDB on mount
  useEffect(() => {
    async function initializeData() {
      try {
        const loadedOutfits = await loadOutfits();
        setOutfits(loadedOutfits);
      } catch (error) {
        console.error("Failed to load outfits:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeData();
  }, []);

  const addOutfit = async (newOutfit: NewOutfit): Promise<Outfit> => {
    const now = new Date();
    const outfit: Outfit = {
      ...newOutfit,
      id: generateId(),
      createdAt: newOutfit.createdAt ?? now, // Use provided date or default to now
      updatedAt: now,
    };

    // Save to IndexedDB first
    await addOutfit(outfit);

    // Then update state
    setOutfits((prev) => [outfit, ...prev]);
    return outfit;
  };

  const updateOutfit = async (
    id: string,
    updates: Partial<Outfit>
  ): Promise<void> => {
    const outfitToUpdate = outfits.find((outfit) => outfit.id === id);
    if (!outfitToUpdate) {
      throw new Error("Outfit not found");
    }

    const updatedOutfit = {
      ...outfitToUpdate,
      ...updates,
      updatedAt: new Date(),
    };

    // Save to IndexedDB first
    await addOutfit(updatedOutfit);

    // Then update state
    setOutfits((prev) =>
      prev.map((outfit) => (outfit.id === id ? updatedOutfit : outfit))
    );
  };

  const getOutfitById = (id: string): Outfit | undefined => {
    return outfits.find((outfit) => outfit.id === id);
  };

  const getRecentOutfits = (limit = 10): Outfit[] => {
    return [...outfits]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  };

  const getOutfitsByItemId = (itemId: string): Outfit[] => {
    return outfits
      .filter((outfit) => outfit.itemIds.includes(itemId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const value: OutfitContextValue = {
    outfits,
    addOutfit,
    updateOutfit,
    getOutfitById,
    getRecentOutfits,
    getOutfitsByItemId,
    isLoading,
  };

  return (
    <OutfitContext.Provider value={value}>{children}</OutfitContext.Provider>
  );
}

export function useOutfit(): OutfitContextValue {
  const context = useContext(OutfitContext);
  if (context === undefined) {
    throw new Error("useOutfit must be used within an OutfitProvider");
  }
  return context;
}
