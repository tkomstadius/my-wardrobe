import { useEffect, useMemo, useState } from 'react';
import { IoSparklesOutline } from 'react-icons/io5';
import { useLoaderData } from 'react-router';
import { ItemCard } from '../components/common/ItemCard';
import { OutfitRatingPrompt } from '../components/common/OutfitRatingPrompt';
import { OutfitSuggestionDialog } from '../components/common/OutfitSuggestionDialog';
import { Button } from '../components/common/ui/Button';
import { Flex } from '../components/common/ui/Flex';
import { Text } from '../components/common/ui/Text';
import { WearAgainSection } from '../components/common/WearAgainSection';
import { useWeather } from '../contexts/WeatherContext';
import type { Outfit, OutfitRating } from '../types/outfit';
import { findUnratedOutfits } from '../utils/outfitRatingPrompt';
import { loadItems, loadOutfits, updateOutfit } from '../utils/storageCommands';
import { getItemsWornToday } from '../utils/wardrobeFilters';
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

  const todayItems = useMemo(() => getItemsWornToday(items), [items]);

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
    setSuggestionDialogOpen(true);
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
          key={currentOutfit.id}
          outfit={currentOutfit}
          onRate={handleRateOutfit}
          onDismiss={handleDismissRating}
          currentIndex={currentOutfitIndex}
          totalCount={unratedOutfits.length}
        />
      )}
      <OutfitSuggestionDialog
        open={suggestionDialogOpen}
        onOpenChange={setSuggestionDialogOpen}
        items={items}
        weatherData={weatherData}
      />
      <Flex direction="column" gap="4">
        {!hasItems ? (
          <Text size="2" className={styles.info}>
            No items yet. Add your first wardrobe item to get started!
          </Text>
        ) : (
          <>
            <WearAgainSection items={items} />

            <Flex justify="between" align="center" wrap="wrap" gap="2">
              <Text size="2" className={styles.info}>
                Need an idea?
              </Text>
              <Button
                variant="outline"
                onClick={handleSuggestItem}
                className={styles.suggestButton}
              >
                <IoSparklesOutline size={18} />
                Suggest an outfit
              </Button>
            </Flex>

            {todayItems.length > 0 && (
              <section className={styles.todaySection}>
                <h2 className={styles.sectionTitle}>Worn today</h2>
                <div className={styles.itemsGrid}>
                  {todayItems.map((item) => (
                    <ItemCard item={item} key={item.id} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </Flex>
    </>
  );
}
