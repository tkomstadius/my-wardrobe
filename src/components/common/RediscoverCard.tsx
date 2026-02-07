import { IoCheckmarkOutline, IoCloseOutline, IoRefreshOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import type { OutfitSuggestion } from '../../utils/outfitSuggestion';
import styles from './RediscoverCard.module.css';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Text } from './ui/Text';

interface RediscoverCardProps {
  suggestion: OutfitSuggestion;
  onDismiss: () => void;
  onTryAnother: () => void;
  onLogWear: () => void;
  isLogging?: boolean;
}

export function RediscoverCard({
  suggestion,
  onDismiss,
  onTryAnother,
  onLogWear,
  isLogging = false,
}: RediscoverCardProps) {
  const { featuredItem, complementaryItems, daysSinceWorn } = suggestion;

  const daysSinceWornText =
    daysSinceWorn === -1
      ? 'Never worn'
      : daysSinceWorn === 1
        ? 'Not worn in 1 day'
        : `Not worn in ${daysSinceWorn} days`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Text size="2" weight="bold" className={styles.title}>
          Rediscover This Item
        </Text>
        <div className={styles.headerActions}>
          <IconButton onClick={onTryAnother} size="2">
            <IoRefreshOutline size={18} />
          </IconButton>
          <IconButton onClick={onDismiss} size="2">
            <IoCloseOutline size={18} />
          </IconButton>
        </div>
      </div>

      <div className={styles.content}>
        <Link to={`/item/${featuredItem.id}`} className={styles.featuredLink}>
          <div className={styles.featuredItem}>
            <img
              src={featuredItem.imageUrl}
              alt={featuredItem.brand || 'Featured item'}
              className={styles.featuredImage}
            />
            <div className={styles.featuredInfo}>
              {featuredItem.brand && (
                <Text size="3" weight="bold" className={styles.brand}>
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
      </div>

      <div className={styles.actions}>
        <Button onClick={onLogWear} disabled={isLogging} className={styles.logWearButton}>
          <IoCheckmarkOutline size={18} />
          {isLogging ? 'Logging...' : 'Log Wear'}
        </Button>
      </div>
    </div>
  );
}
