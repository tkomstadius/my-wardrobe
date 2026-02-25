import { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import { FinancialInsightsSection } from '../components/stats/FinancialInsightsSection';
import { HeroStatsSection } from '../components/stats/HeroStatsSection';
import { SeasonalOutfitsSection } from '../components/stats/SeasonalOutfitsSection';
import { WardrobeInsightsSection } from '../components/stats/WardrobeInsightsSection';
import {
  calculateFullStats,
  calculateOutfitSeasonalStats,
  calculateYearlySpending,
} from '../utils/statsCalculations';
import { loadItems, loadOutfits } from '../utils/storageCommands';
import styles from './StatsPage.module.css';

export async function loader() {
  const [items, outfits] = await Promise.all([loadItems(), loadOutfits()]);
  return { items, outfits };
}

export function StatsPage() {
  const { items, outfits } = useLoaderData<typeof loader>();
  const stats = useMemo(() => calculateFullStats(items), [items]);
  const outfitSeasons = useMemo(() => calculateOutfitSeasonalStats(outfits), [outfits]);
  const yearlySpending = useMemo(() => calculateYearlySpending(items), [items]);

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Heading size="6">Statistics</Heading>
        </div>
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No items yet. Add some wardrobe items to see your statistics!
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Heading size="6">Statistics</Heading>
        <Text size="2" color="gray">
          Your wardrobe at a glance
        </Text>
      </div>

      <div className={styles.content}>
        <HeroStatsSection stats={stats} />
        <WardrobeInsightsSection stats={stats} />
        <SeasonalOutfitsSection outfitSeasons={outfitSeasons} />
        <FinancialInsightsSection stats={stats} yearlySpending={yearlySpending} />
      </div>
    </div>
  );
}
