import { useState } from 'react';
import { Link } from 'react-router';
import type { WardrobeItem } from '../../types/wardrobe';
import type { FullStats } from '../../utils/statsCalculations';
import { Heading } from '../common/ui/Heading';
import { Text } from '../common/ui/Text';
import styles from './WardrobeInsightsSection.module.css';

type WearPatternView = 'most' | 'least' | 'never';

const NEVER_WORN_DEFAULT_LIMIT = 10;

function formatItemAge(createdAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Added today';
  if (diffDays === 1) return 'Added 1d ago';
  if (diffDays < 30) return `Added ${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Added ${diffMonths}m ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return `Added ${diffYears}y ago`;
}

function NeverWornSection({ items }: { items: WardrobeItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = items.length > NEVER_WORN_DEFAULT_LIMIT;
  const displayedItems = showAll ? items : items.slice(0, NEVER_WORN_DEFAULT_LIMIT);

  return (
    <div className={styles.subsection}>
      <Text size="3" weight="medium" className={styles.subsectionTitle}>
        Never Worn ({items.length})
      </Text>
      <div className={styles.itemList}>
        {displayedItems.map((item) => (
          <Link key={item.id} to={`/item/${item.id}`} className={styles.itemRow}>
            <div className={styles.itemImage}>
              <img src={item.imageUrl} alt={item.brand || 'Item'} />
            </div>
            <div className={styles.itemInfo}>
              <Text size="2" weight="medium">
                {item.brand || 'Unnamed'}
              </Text>
              <Text size="1" color="gray">
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
            </div>
            <div className={styles.itemWears}>
              <Text size="2" color="gray">
                {formatItemAge(item.createdAt)}
              </Text>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          className={styles.showAllButton}
          onClick={() => setShowAll((prev) => !prev)}
        >
          <Text size="2" weight="medium">
            {showAll ? 'Show Less' : `Show All (${items.length})`}
          </Text>
        </button>
      )}
    </div>
  );
}

interface WardrobeInsightsSectionProps {
  stats: FullStats;
}

export function WardrobeInsightsSection({ stats }: WardrobeInsightsSectionProps) {
  const [wearView, setWearView] = useState<WearPatternView>('most');

  return (
    <section className={styles.section}>
      <Heading size="4" className={styles.sectionTitle}>
        Wardrobe Insights
      </Heading>

      {/* Wear Patterns - Tabbed view */}
      <div className={styles.subsection}>
        <div className={styles.wearPatternHeader}>
          <Text size="3" weight="medium" className={styles.subsectionTitle}>
            Item Activity
          </Text>
          <div className={styles.wearPatternTabs}>
            <button
              type="button"
              className={`${styles.tab} ${wearView === 'most' ? styles.tabActive : ''}`}
              onClick={() => setWearView('most')}
            >
              <Text size="1" weight="medium">
                Most Worn
              </Text>
            </button>
            <button
              type="button"
              className={`${styles.tab} ${wearView === 'least' ? styles.tabActive : ''}`}
              onClick={() => setWearView('least')}
            >
              <Text size="1" weight="medium">
                Least Worn
              </Text>
            </button>
            <button
              type="button"
              className={`${styles.tab} ${wearView === 'never' ? styles.tabActive : ''}`}
              onClick={() => setWearView('never')}
            >
              <Text size="1" weight="medium">
                Never Worn ({stats.neverWorn.length})
              </Text>
            </button>
          </div>
        </div>

        <div className={styles.itemList}>
          {wearView === 'most' &&
            stats.mostWorn.map((item) => (
              <Link key={item.id} to={`/item/${item.id}`} className={styles.itemRow}>
                <div className={styles.itemImage}>
                  <img src={item.imageUrl} alt={item.brand || 'Item'} />
                </div>
                <div className={styles.itemInfo}>
                  <Text size="2" weight="medium">
                    {item.brand || 'Unnamed'}
                  </Text>
                  <Text size="1" color="gray">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Text>
                </div>
                <div className={styles.itemWears}>
                  <Text size="3" weight="bold">
                    {item.wearCount}×
                  </Text>
                </div>
              </Link>
            ))}

          {wearView === 'least' &&
            stats.leastWorn.map((item) => (
              <Link key={item.id} to={`/item/${item.id}`} className={styles.itemRow}>
                <div className={styles.itemImage}>
                  <img src={item.imageUrl} alt={item.brand || 'Item'} />
                </div>
                <div className={styles.itemInfo}>
                  <Text size="2" weight="medium">
                    {item.brand || 'Unnamed'}
                  </Text>
                  <Text size="1" color="gray">
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                  </Text>
                </div>
                <div className={styles.itemWears}>
                  <Text size="3" weight="bold" color="orange">
                    {item.wearCount}×
                  </Text>
                </div>
              </Link>
            ))}

          {wearView === 'never' && <NeverWornSection items={stats.neverWorn} />}
        </div>
      </div>

      {/* Category Favorites */}
      {stats.categoryFavorites.length > 0 && (
        <div className={styles.subsection}>
          <Text size="3" weight="medium" className={styles.subsectionTitle}>
            Top Item per Category
          </Text>
          <div className={styles.itemList}>
            {stats.categoryFavorites.map(({ category, item, wearRate }) => (
              <Link key={item.id} to={`/item/${item.id}`} className={styles.itemRow}>
                <div className={styles.itemImage}>
                  <img src={item.imageUrl} alt={item.brand || 'Item'} />
                </div>
                <div className={styles.itemInfo}>
                  <Text size="2" weight="medium">
                    {item.brand || 'Unnamed'}
                  </Text>
                  <Text size="1" color="gray">
                    {category}
                  </Text>
                </div>
                <div className={styles.itemWears}>
                  <Text size="2" weight="bold">
                    {wearRate.toFixed(1)}×
                  </Text>
                  <Text size="1" color="gray">
                    /mo
                  </Text>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
