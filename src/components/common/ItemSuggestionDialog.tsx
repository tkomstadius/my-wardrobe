import { useState } from 'react';
import { IoCheckmarkOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import type { OutfitSuggestion } from '../../utils/outfitSuggestion';
import { incrementWearCount } from '../../utils/storageCommands';
import styles from './ItemSuggestionDialog.module.css';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import { Flex } from './ui/Flex';
import { Text } from './ui/Text';

interface ItemSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: OutfitSuggestion | null;
  onTryAnother: () => void;
}

export function ItemSuggestionDialog({
  open,
  onOpenChange,
  suggestion,
  onTryAnother,
}: ItemSuggestionDialogProps) {
  const [isLogging, setIsLogging] = useState(false);

  if (!suggestion) {
    return null;
  }

  const { featuredItem, complementaryItems, daysSinceWorn } = suggestion;

  const daysSinceWornText =
    daysSinceWorn === -1
      ? 'Never worn'
      : daysSinceWorn === 1
        ? 'Not worn in 1 day'
        : `Not worn in ${daysSinceWorn} days`;

  const handleLogWear = async () => {
    setIsLogging(true);
    try {
      const itemsToLog = [featuredItem, ...complementaryItems];
      await Promise.all(itemsToLog.map((item) => incrementWearCount(item.id)));
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
        <Dialog.Title>Rediscover This Item</Dialog.Title>

        <Dialog.Description size="2" color="var(--text-secondary)" mb="1rem">
          Here's a neglected item from your wardrobe with pieces to complete the look.
        </Dialog.Description>

        <Flex direction="column" gap="4">
          <Link to={`/item/${featuredItem.id}`} className={styles.featuredLink}>
            <div className={styles.featuredItem}>
              <img
                src={featuredItem.imageUrl}
                alt={featuredItem.brand || 'Featured item'}
                className={styles.featuredImage}
              />
              <div className={styles.featuredInfo}>
                {featuredItem.brand && (
                  <Text size="3" weight="bold">
                    {featuredItem.brand}
                  </Text>
                )}
                <Text size="1" className={styles.daysSince}>
                  {daysSinceWornText}
                </Text>
              </div>
            </div>
          </Link>

          {complementaryItems.length > 0 && (
            <div className={styles.complementary}>
              <Text size="1" className={styles.complementaryLabel}>
                Complete the look:
              </Text>
              <div className={styles.complementaryItems}>
                {complementaryItems.map((item) => (
                  <Link key={item.id} to={`/item/${item.id}`} className={styles.complementaryLink}>
                    <img
                      src={item.imageUrl}
                      alt={item.brand || 'Complementary item'}
                      className={styles.complementaryImage}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Flex gap="3" justify="end">
            <Button onClick={onTryAnother}>Try Another</Button>
            <Button onClick={handleLogWear} disabled={isLogging} className={styles.logWearButton}>
              <IoCheckmarkOutline size={18} />
              {isLogging ? 'Logging...' : 'Log Wear'}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
