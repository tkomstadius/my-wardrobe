import type { WardrobeItem } from '../types/wardrobe';
import { CATEGORIES } from './categories';

/**
 * Get the number of wears tracked in the app (excluding initial wear count)
 */
function getAppTrackedWears(item: WardrobeItem): number {
  return item.wearHistory?.length || 0;
}

export type Season = 'winter' | 'spring' | 'summer' | 'fall';

/**
 * Determine the season for a given date
 */
function getSeason(date: Date): Season {
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
  if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
  if (month >= 8 && month <= 10) return 'fall'; // Sep, Oct, Nov
  return 'winter'; // Dec, Jan, Feb
}

/**
 * Calculate wear rate (wears per month owned)
 */
function getWearRatePerMonth(item: WardrobeItem): number {
  const wears = getAppTrackedWears(item);
  if (wears === 0) return 0;

  const now = new Date();
  const msOwned = now.getTime() - item.createdAt.getTime();
  const monthsOwned = msOwned / (1000 * 60 * 60 * 24 * 30);

  // Minimum 0.5 months to avoid division issues for very new items
  return wears / Math.max(monthsOwned, 0.5);
}

export interface SeasonalStats {
  season: Season;
  label: string;
  wearCount: number;
  percentage: number;
}

export interface ItemWithSeasonalData {
  item: WardrobeItem;
  dominantSeason: Season | null;
  seasonCounts: Record<Season, number>;
}

export interface CategoryFavorite {
  category: string;
  categoryId: string;
  item: WardrobeItem;
  wearRate: number;
}

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
  mostWorn: WardrobeItem[];
  leastWorn: WardrobeItem[];
  neverWorn: WardrobeItem[];
  // Favorites (excluding dog casual) - highest wear rate
  favorites: Array<{ item: WardrobeItem; wearRate: number }>;
  // Favorite item per category
  categoryFavorites: CategoryFavorite[];
  // Seasonal wear distribution
  seasonalWears: SeasonalStats[];
  // Items with their dominant season
  seasonalItems: ItemWithSeasonalData[];
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
  const totalWears = items.reduce((sum, item) => sum + getAppTrackedWears(item), 0);
  const averageWears = totalItems > 0 ? totalWears / totalItems : 0;

  const itemsWithPrice = items.filter(
    (item) => item.price !== undefined && item.price > 0 && getAppTrackedWears(item) > 0,
  );
  const avgCostPerWear =
    itemsWithPrice.length > 0
      ? itemsWithPrice.reduce(
          (sum, item) => sum + (item.price || 0) / getAppTrackedWears(item),
          0,
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
    const wears = categoryItems.reduce((sum, item) => sum + getAppTrackedWears(item), 0);
    return {
      category: cat.title,
      count: categoryItems.length,
      wears,
    };
  }).sort((a, b) => b.wears - a.wears);

  // Most worn items (by app-tracked wears)
  const mostWorn = [...items]
    .filter((item) => getAppTrackedWears(item) > 0)
    .sort((a, b) => getAppTrackedWears(b) - getAppTrackedWears(a))
    .slice(0, 10);

  // Least worn items (excluding never worn in app)
  const leastWorn = [...items]
    .filter((item) => getAppTrackedWears(item) > 0)
    .sort((a, b) => getAppTrackedWears(a) - getAppTrackedWears(b))
    .slice(0, 10);

  // Never worn items (in app)
  const neverWorn = items.filter((item) => getAppTrackedWears(item) === 0);

  // Favorites - highest wear rate per month owned
  // Excludes: dog casual, outerwear, jewelry, shoes, accessories
  const favoritesExcludedCategories = ['outerwear', 'jewelry', 'shoes', 'accessories'];
  const favorites = [...items]
    .filter(
      (item) =>
        !item.isDogCasual &&
        !favoritesExcludedCategories.includes(item.category) &&
        getAppTrackedWears(item) > 0,
    )
    .map((item) => ({
      item,
      wearRate: getWearRatePerMonth(item),
    }))
    .sort((a, b) => b.wearRate - a.wearRate)
    .slice(0, 5);

  // Favorite item per category (excluding dog casual)
  const categoryFavorites: CategoryFavorite[] = [];
  for (const cat of CATEGORIES) {
    const categoryItems = items
      .filter(
        (item) => item.category === cat.id && !item.isDogCasual && getAppTrackedWears(item) > 0,
      )
      .map((item) => ({
        item,
        wearRate: getWearRatePerMonth(item),
      }))
      .sort((a, b) => b.wearRate - a.wearRate);

    const topItem = categoryItems[0];
    if (topItem) {
      categoryFavorites.push({
        category: cat.title,
        categoryId: cat.id,
        item: topItem.item,
        wearRate: topItem.wearRate,
      });
    }
  }

  // Seasonal wear analysis
  // Excludes: dog casual, accessories, jewelry
  const seasonalExcludedCategories = ['accessories', 'jewelry'];
  const seasonLabels: Record<Season, string> = {
    winter: 'Winter',
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
  };

  const allSeasonCounts: Record<Season, number> = {
    winter: 0,
    spring: 0,
    summer: 0,
    fall: 0,
  };

  const seasonalItems: ItemWithSeasonalData[] = items
    .filter(
      (item) =>
        getAppTrackedWears(item) > 0 &&
        !item.isDogCasual &&
        !seasonalExcludedCategories.includes(item.category),
    )
    .map((item) => {
      const seasonCounts: Record<Season, number> = {
        winter: 0,
        spring: 0,
        summer: 0,
        fall: 0,
      };

      for (const wearDate of item.wearHistory || []) {
        const season = getSeason(new Date(wearDate));
        seasonCounts[season]++;
        allSeasonCounts[season]++;
      }

      // Find dominant season (the one with most wears)
      let dominantSeason: Season | null = null;
      let maxCount = 0;
      for (const s of ['winter', 'spring', 'summer', 'fall'] as Season[]) {
        if (seasonCounts[s] > maxCount) {
          maxCount = seasonCounts[s];
          dominantSeason = s;
        }
      }

      return { item, dominantSeason, seasonCounts };
    });

  const totalSeasonalWears = Object.values(allSeasonCounts).reduce((a, b) => a + b, 0);
  const seasonalWears: SeasonalStats[] = (['winter', 'spring', 'summer', 'fall'] as Season[]).map(
    (season) => ({
      season,
      label: seasonLabels[season],
      wearCount: allSeasonCounts[season],
      percentage: totalSeasonalWears > 0 ? (allSeasonCounts[season] / totalSeasonalWears) * 100 : 0,
    }),
  );

  // Financial stats
  const itemsWithPrice = items.filter((item) => item.price !== undefined && item.price > 0);
  const totalValue = itemsWithPrice.reduce((sum, item) => sum + (item.price || 0), 0);

  const itemsWithCostPerWear = itemsWithPrice.filter((item) => getAppTrackedWears(item) > 0);
  const avgCostPerWear =
    itemsWithCostPerWear.length > 0
      ? itemsWithCostPerWear.reduce(
          (sum, item) => sum + (item.price || 0) / getAppTrackedWears(item),
          0,
        ) / itemsWithCostPerWear.length
      : 0;

  const bestValue = [...itemsWithCostPerWear]
    .map((item) => ({
      item,
      costPerWear: (item.price || 0) / getAppTrackedWears(item),
    }))
    .sort((a, b) => a.costPerWear - b.costPerWear)
    .slice(0, 5);

  const secondHandCount = items.filter((item) => item.isSecondHand).length;
  const secondHandPercentage =
    quickStats.totalItems > 0 ? (secondHandCount / quickStats.totalItems) * 100 : 0;

  return {
    ...quickStats,
    categoryWears,
    mostWorn,
    leastWorn,
    neverWorn,
    favorites,
    categoryFavorites,
    seasonalWears,
    seasonalItems,
    totalValue,
    avgCostPerWear,
    bestValue,
    secondHandCount,
    secondHandPercentage,
  };
}
