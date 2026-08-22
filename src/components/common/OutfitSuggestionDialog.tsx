import { useEffect, useState } from 'react';
import { IoCheckmarkOutline, IoRefreshOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import type { WeatherData } from '../../contexts/WeatherContext';
import type { WardrobeItem } from '../../types/wardrobe';
import { CATEGORIES } from '../../utils/categories';
import { requestOutfitSuggestion } from '../../utils/outfitAiSuggestion';
import { incrementWearCount } from '../../utils/storageCommands';
import styles from './OutfitSuggestionDialog.module.css';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import { Flex } from './ui/Flex';
import { Text } from './ui/Text';

interface OutfitSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WardrobeItem[];
  weatherData: WeatherData | null;
}

type LoadState = 'mood' | 'loading' | 'ready' | 'empty' | 'error';

const MOOD_OPTIONS = [
  { value: 'comfortable', label: 'Extra comfortable' },
  { value: 'edgy', label: 'Give me an edge' },
  { value: 'pick-me-up', label: 'Pick me up' },
  { value: 'polished', label: 'Polished' },
  { value: 'cozy', label: 'Cozy' },
];

export function OutfitSuggestionDialog({
  open,
  onOpenChange,
  items,
  weatherData,
}: OutfitSuggestionDialogProps) {
  const [state, setState] = useState<LoadState>('mood');
  const [mood, setMood] = useState<string | null>(null);
  const [suggestedItemIds, setSuggestedItemIds] = useState<string[]>([]);
  const [rationale, setRationale] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const fetchSuggestion = async (moodValue: string | null, excludeItemIds: string[] = []) => {
    setState('loading');
    try {
      const result = await requestOutfitSuggestion(weatherData, moodValue, excludeItemIds);
      if (!result) {
        setState('empty');
        return;
      }
      setSuggestedItemIds(result.itemIds);
      setRationale(result.rationale);
      setState('ready');
    } catch (err) {
      console.error('Failed to get outfit suggestion:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setState('error');
    }
  };

  useEffect(() => {
    if (open) {
      setState('mood');
      setMood(null);
    }
  }, [open]);

  const handleSelectMood = (selected: string | null) => {
    setMood(selected);
    fetchSuggestion(selected);
  };

  const suggestedItems = items.filter((item) => suggestedItemIds.includes(item.id));
  const groupedItems = CATEGORIES.map((category) => ({
    title: category.title,
    items: suggestedItems.filter((item) => item.category === category.id),
  })).filter((group) => group.items.length > 0);

  const handleTryAnother = () => {
    fetchSuggestion(mood, suggestedItemIds);
  };

  const handleLogWear = async () => {
    setIsLogging(true);
    try {
      await Promise.all(suggestedItemIds.map((id) => incrementWearCount(id)));
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to log wear:', err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: '90vw', width: '500px' }}>
        <Dialog.Title>Suggested Outfit</Dialog.Title>

        {state === 'mood' && (
          <Flex direction="column" gap="3">
            <Text size="2" color="secondary">
              What's the mood today?
            </Text>
            <div className={styles.moodOptions}>
              {MOOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  onClick={() => handleSelectMood(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <Flex justify="end">
              <Button onClick={() => handleSelectMood(null)}>Surprise me</Button>
            </Flex>
          </Flex>
        )}

        {state === 'loading' && (
          <Text size="2" color="secondary">
            Putting together an outfit...
          </Text>
        )}

        {state === 'empty' && (
          <Flex direction="column" gap="3">
            <Text size="2" color="secondary">
              No eligible items to suggest an outfit from right now.
            </Text>
            <Flex justify="end">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </Flex>
          </Flex>
        )}

        {state === 'error' && (
          <Flex direction="column" gap="3">
            <Text size="2" color="red">
              {errorMessage}
            </Text>
            <Flex justify="end" gap="3">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => fetchSuggestion(mood)}>
                <IoRefreshOutline size={18} />
                Retry
              </Button>
            </Flex>
          </Flex>
        )}

        {state === 'ready' && (
          <Flex direction="column" gap="4">
            {rationale && (
              <Text size="2" color="secondary" className={styles.rationale}>
                {rationale}
              </Text>
            )}

            {groupedItems.map((group) => (
              <div key={group.title} className={styles.group}>
                <Text size="1" className={styles.groupLabel}>
                  {group.title}
                </Text>
                <div className={styles.groupItems}>
                  {group.items.map((item) => (
                    <Link key={item.id} to={`/item/${item.id}`} className={styles.itemLink}>
                      <img
                        src={item.imageUrl}
                        alt={item.brand || item.category}
                        className={styles.itemImage}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <Flex gap="3" justify="end">
              <Button onClick={handleTryAnother}>
                <IoRefreshOutline size={18} />
                Try Another
              </Button>
              <Button onClick={handleLogWear} disabled={isLogging} className={styles.logWearButton}>
                <IoCheckmarkOutline size={18} />
                {isLogging ? 'Logging...' : 'Log Wear'}
              </Button>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
