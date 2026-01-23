import { Text } from "../components/common/ui/Text";
import { Tabs } from "../components/common/ui/Tabs";
import { Flex } from "../components/common/ui/Flex";
import { Button } from "../components/common/ui/Button";
import { useLoaderData } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { ItemCard } from "../components/common/ItemCard";
import { getDaysAgo } from "../utils/dateFormatter";
import { loadItems, loadOutfits, updateOutfit } from "../utils/storageCommands";
import {
  getItemsWornToday,
  getItemsWornInPeriod,
  getNeglectedItems,
} from "../utils/wardrobeFilters";
import { calculateQuickStats } from "../utils/statsCalculations";
import {
  THIS_WEEK_DAYS,
  NEGLECTED_ITEMS_THRESHOLD_DAYS,
} from "../utils/config";
import styles from "./HomePage.module.css";
import { StatsCard } from "../components/common/StatsCard";
import { CategoryItemsAccordion } from "../components/common/CategoryItemsAccordion";
import { OutfitRatingPrompt } from "../components/common/OutfitRatingPrompt";
import { findUnratedOutfits } from "../utils/outfitRatingPrompt";
import type { Outfit, OutfitRating } from "../types/outfit";
import { useWeather } from "../contexts/WeatherContext";
import { suggestItem } from "../utils/itemSuggestion";
import { ItemSuggestionDialog } from "../components/common/ItemSuggestionDialog";
import type { WardrobeItem } from "../types/wardrobe";

export async function loader() {
  try {
    const items = await loadItems();
    const outfits = await loadOutfits();
    return { items, outfits, error: null };
  } catch (error) {
    console.error("Failed to load items:", error);
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
  const [suggestedItem, setSuggestedItem] = useState<WardrobeItem | null>(null);

  const todayItems = useMemo(() => getItemsWornToday(items), [items]);
  const weekItems = useMemo(
    () => getItemsWornInPeriod(items, getDaysAgo(THIS_WEEK_DAYS)),
    [items]
  );
  const neglectedItems = useMemo(
    () => getNeglectedItems(items, NEGLECTED_ITEMS_THRESHOLD_DAYS),
    [items]
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
    const suggestion = suggestItem(items, weatherData);
    setSuggestedItem(suggestion);
    setSuggestionDialogOpen(true);
  };

  const handleTryAnother = () => {
    const suggestion = suggestItem(items, weatherData);
    setSuggestedItem(suggestion);
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
        suggestedItem={suggestedItem}
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
                {items.length} {items.length === 1 ? "item" : "items"} total
              </Text>
              <Button
                onClick={handleSuggestItem}
              >
                ✨
              </Button>
            </Flex>

            <Flex direction="column" gap="4">
              <section>
                <div className={styles.quickStatsGrid}>
                  <StatsCard
                    title="Total Wears"
                    value={quickStats.totalWears}
                  />
                  <StatsCard
                    title="Avg per Item"
                    value={quickStats.averageWears.toFixed(1)}
                  />
                  {quickStats.avgCostPerWear !== null && (
                    <StatsCard
                      title="Avg Cost/Wear"
                      value={quickStats.avgCostPerWear.toFixed(2)}
                    />
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
                    <Flex direction="column" gap="2">
                      {todayItems.map((item) => (
                        <ItemCard item={item} key={item.id} />
                      ))}
                    </Flex>
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
                    <CategoryItemsAccordion
                      items={weekItems.map((entry) => entry.item)}
                    />
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
