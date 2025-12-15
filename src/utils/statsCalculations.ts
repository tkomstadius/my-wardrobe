import type { WardrobeItem, ItemTrait } from "../types/wardrobe";
import { CATEGORIES } from "./categories";

export interface QuickStats {
  totalItems: number;
  totalWears: number;
  averageWears: number;
  avgCostPerWear: number | null;
}

export interface FullStats extends QuickStats {
  categoryWears: Array<{
    category: string;
    count: number;
    wears: number;
  }>;
  traitWears: Record<ItemTrait, { count: number; wears: number }>;
  mostWorn: WardrobeItem[];
  leastWorn: WardrobeItem[];
  neverWorn: WardrobeItem[];
  totalValue: number;
  avgCostPerWear: number;
  bestValue: Array<{ item: WardrobeItem; costPerWear: number }>;
  secondHandCount: number;
  secondHandPercentage: number;
}

/**
 * Calculate quick stats for home page
 */
export function calculateQuickStats(items: WardrobeItem[]): QuickStats {
  const totalItems = items.length;
  const totalWears = items.reduce((sum, item) => sum + item.wearCount, 0);
  const averageWears = totalItems > 0 ? totalWears / totalItems : 0;

  const itemsWithPrice = items.filter(
    (item) => item.price !== undefined && item.price > 0 && item.wearCount > 0
  );
  const avgCostPerWear =
    itemsWithPrice.length > 0
      ? itemsWithPrice.reduce(
          (sum, item) => sum + (item.price || 0) / item.wearCount,
          0
        ) / itemsWithPrice.length
      : null;

  return {
    totalItems,
    totalWears,
    averageWears,
    avgCostPerWear,
  };
}

/**
 * Calculate full stats for stats page
 */
export function calculateFullStats(items: WardrobeItem[]): FullStats {
  const quickStats = calculateQuickStats(items);

  // Category distribution
  const categoryWears = CATEGORIES.map((cat) => {
    const categoryItems = items.filter((item) => item.category === cat.id);
    const wears = categoryItems.reduce((sum, item) => sum + item.wearCount, 0);
    return {
      category: cat.title,
      count: categoryItems.length,
      wears,
    };
  }).sort((a, b) => b.wears - a.wears);

  // Trait distribution
  const traitWears: Record<ItemTrait, { count: number; wears: number }> = {
    comfort: { count: 0, wears: 0 },
    confidence: { count: 0, wears: 0 },
    creative: { count: 0, wears: 0 },
  };

  items.forEach((item) => {
    if (item.trait) {
      const traitData = traitWears[item.trait];
      if (traitData) {
        traitData.count += 1;
        traitData.wears += item.wearCount;
      }
    }
  });

  // Most worn items
  const mostWorn = [...items]
    .filter((item) => item.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount)
    .slice(0, 10);

  // Least worn items (excluding never worn)
  const leastWorn = [...items]
    .filter((item) => item.wearCount > 0)
    .sort((a, b) => a.wearCount - b.wearCount)
    .slice(0, 10);

  // Never worn items
  const neverWorn = items.filter((item) => item.wearCount === 0);

  // Financial stats
  const itemsWithPrice = items.filter(
    (item) => item.price !== undefined && item.price > 0
  );
  const totalValue = itemsWithPrice.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );

  const itemsWithCostPerWear = itemsWithPrice.filter(
    (item) => item.wearCount > 0
  );
  const avgCostPerWear =
    itemsWithCostPerWear.length > 0
      ? itemsWithCostPerWear.reduce(
          (sum, item) => sum + (item.price || 0) / item.wearCount,
          0
        ) / itemsWithCostPerWear.length
      : 0;

  const bestValue = [...itemsWithCostPerWear]
    .map((item) => ({
      item,
      costPerWear: (item.price || 0) / item.wearCount,
    }))
    .sort((a, b) => a.costPerWear - b.costPerWear)
    .slice(0, 5);

  const secondHandCount = items.filter((item) => item.isSecondHand).length;
  const secondHandPercentage =
    quickStats.totalItems > 0
      ? (secondHandCount / quickStats.totalItems) * 100
      : 0;

  return {
    ...quickStats,
    categoryWears,
    traitWears,
    mostWorn,
    leastWorn,
    neverWorn,
    totalValue,
    avgCostPerWear,
    bestValue,
    secondHandCount,
    secondHandPercentage,
  };
}
