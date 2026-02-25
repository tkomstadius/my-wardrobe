import { useEffect, useMemo, useState } from 'react';
import { IoSparklesOutline } from 'react-icons/io5';
import { useLoaderData } from 'react-router';
import { CategoryItemsAccordion } from '../components/common/CategoryItemsAccordion';
import { ItemCard } from '../components/common/ItemCard';
import { ItemSuggestionDialog } from '../components/common/ItemSuggestionDialog';
import { OutfitRatingPrompt } from '../components/common/OutfitRatingPrompt';
import { StatsCard } from '../components/common/StatsCard';
import { Button } from '../components/common/ui/Button';
import { Flex } from '../components/common/ui/Flex';
import { Tabs } from '../components/common/ui/Tabs';
import { Text } from '../components/common/ui/Text';
import { useWeather } from '../contexts/WeatherContext';
import type { Outfit, OutfitRating } from '../types/outfit';
import { NEGLECTED_ITEMS_THRESHOLD_DAYS, THIS_WEEK_DAYS } from '../utils/config';
import { getDaysAgo } from '../utils/dateFormatter';
import { findUnratedOutfits } from '../utils/outfitRatingPrompt';
import { type OutfitSuggestion, suggestRediscoverOutfit } from '../utils/outfitSuggestion';
import { calculateQuickStats } from '../utils/statsCalculations';
import { loadItems, loadOutfits, updateOutfit } from '../utils/storageCommands';
import {
  getItemsWornInPeriod,
  getItemsWornToday,
  getNeglectedItems,
} from '../utils/wardrobeFilters';
import styles from './HomePage.module.css';

export async function loader() {
  try {
    const items = await loadItems();
    const outfits = await loadOutfits();
    return { items, outfits, error: null };
  } catch (error) {
    console.error('Failed to load items:', error);
    return { items: [], error: error as string };
  }
}

export function HomePage() {
  const { items, outfits, error } = useLoaderData<typeof loader>();
  const { weatherData } = useWeather();
  const hasItems = items.length > 0;
  const [unratedOutfits, setUnratedOutfits] = useState<Outfit[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<OutfitSuggestion | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const todayItems = useMemo(() => getItemsWornToday(items), [items]);
  const weekItems = useMemo(() => getItemsWornInPeriod(items, getDaysAgo(THIS_WEEK_DAYS)), [items]);
  const neglectedItems = useMemo(
    () => getNeglectedItems(items, NEGLECTED_ITEMS_THRESHOLD_DAYS),
    [items],
  );

  const quickStats = useMemo(() => calculateQuickStats(items), [items]);

  // Find unrated outfits when component mounts or outfits change
  useEffect(() => {
    const unrated = findUnratedOutfits(outfits);
    setUnratedOutfits(unrated);
    setCurrentOutfitIndex(0);
  }, [outfits]);

  const handleRateOutfit = async (outfitId: string, rating: OutfitRating) => {
    await updateOutfit(outfitId, { rating });
    // Move to next outfit or close if no more
    if (currentOutfitIndex < unratedOutfits.length - 1) {
      setCurrentOutfitIndex(currentOutfitIndex + 1);
    } else {
      setUnratedOutfits([]);
    }
  };

  const handleDismissRating = () => {
    // Move to next outfit or close if no more
    if (currentOutfitIndex < unratedOutfits.length - 1) {
      setCurrentOutfitIndex(currentOutfitIndex + 1);
    } else {
      setUnratedOutfits([]);
    }
  };

  const handleSuggestItem = () => {
    const newSuggestion = suggestRediscoverOutfit(items, weatherData, dismissedIds);
    setSuggestion(newSuggestion);
    setSuggestionDialogOpen(true);
  };

  const handleTryAnother = () => {
    // Add current suggestion to dismissed and get a new one
    if (suggestion) {
      const newDismissed = new Set([...dismissedIds, suggestion.featuredItem.id]);
      setDismissedIds(newDismissed);
      const newSuggestion = suggestRediscoverOutfit(items, weatherData, newDismissed);
      setSuggestion(newSuggestion);
    }
  };

  const currentOutfit = unratedOutfits[currentOutfitIndex];

  if (error) {
    return (
      <Text size="2" color="red">
        Could not load items.
      </Text>
    );
  }

  return (
    <>
      {currentOutfit && (
        <OutfitRatingPrompt
          outfit={currentOutfit}
          onRate={handleRateOutfit}
          onDismiss={handleDismissRating}
          currentIndex={currentOutfitIndex}
          totalCount={unratedOutfits.length}
        />
      )}
      <ItemSuggestionDialog
        open={suggestionDialogOpen}
        onOpenChange={setSuggestionDialogOpen}
        suggestion={suggestion}
        onTryAnother={handleTryAnother}
      />
      <Flex direction="column" gap="4">
        {!hasItems ? (
          <Text size="2" className={styles.info}>
            No items yet. Add your first wardrobe item to get started!
          </Text>
        ) : (
          <>
            <Flex justify="between" align="center" wrap="wrap" gap="2">
              <Text size="2" className={styles.info}>
                {items.length} {items.length === 1 ? 'item' : 'items'} total
              </Text>
              <Button onClick={handleSuggestItem} className={styles.suggestButton}>
                <IoSparklesOutline size={18} />
                Suggest
              </Button>
            </Flex>

            <Flex direction="column" gap="4">
              <section>
                <div className={styles.quickStatsGrid}>
                  <StatsCard title="Total Wears" value={quickStats.totalWears} />
                  <StatsCard title="Avg per Item" value={quickStats.averageWears.toFixed(1)} />
                  {quickStats.avgCostPerWear !== null && (
                    <StatsCard title="Avg Cost/Wear" value={quickStats.avgCostPerWear.toFixed(2)} />
                  )}
                </div>
              </section>

              <Tabs.Root defaultValue="today">
                <Tabs.List className={styles.tabsList}>
                  <Tabs.Trigger value="today" className={styles.tabTrigger}>
                    Today
                  </Tabs.Trigger>
                  <Tabs.Trigger value="week" className={styles.tabTrigger}>
                    This Week
                  </Tabs.Trigger>
                  <Tabs.Trigger value="neglected" className={styles.tabTrigger}>
                    Neglected
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="today" className={styles.tabContent}>
                  {todayItems.length === 0 ? (
                    <div className={styles.emptySection}>
                      <Text size="1" as="p">
                        No items worn today yet.
                      </Text>
                      <Text size="1" as="p">
                        Mark items as worn to track what you're wearing!
                      </Text>
                    </div>
                  ) : (
                    <div className={styles.itemsGrid}>
                      {todayItems.map((item) => (
                        <ItemCard item={item} key={item.id} />
                      ))}
                    </div>
                  )}
                </Tabs.Content>

                <Tabs.Content value="week" className={styles.tabContent}>
                  {weekItems.length === 0 ? (
                    <div className={styles.emptySection}>
                      <Text size="1" as="p">
                        No items worn in the last 7 days.
                      </Text>
                      <Text size="1" as="p">
                        Mark items as worn to track your wardrobe usage!
                      </Text>
                    </div>
                  ) : (
                    <CategoryItemsAccordion items={weekItems.map((entry) => entry.item)} />
                  )}
                </Tabs.Content>

                <Tabs.Content value="neglected" className={styles.tabContent}>
                  {neglectedItems.length === 0 ? (
                    <div className={styles.emptySection}>
                      <Text size="2" color="gray">
                        Great job! All your items have been worn recently.
                      </Text>
                    </div>
                  ) : (
                    <CategoryItemsAccordion items={neglectedItems} />
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </Flex>
          </>
        )}
      </Flex>
    </>
  );
}
