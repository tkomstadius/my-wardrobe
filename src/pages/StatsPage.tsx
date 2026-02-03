import { useMemo, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { StatsCard } from '../components/common/StatsCard';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import type { WardrobeItem } from '../types/wardrobe';
import { calculateFullStats } from '../utils/statsCalculations';
import { loadItems } from '../utils/storageCommands';
import styles from './StatsPage.module.css';

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

export async function loader() {
  const items = await loadItems();
  return { items };
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

export function StatsPage() {
  const { items } = useLoaderData<typeof loader>();
  const stats = useMemo(() => calculateFullStats(items), [items]);

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
          Insights into your wardrobe
        </Text>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.statsGrid}>
            <StatsCard title="Total Items" value={stats.totalItems} />
            <StatsCard title="Total Wears" value={stats.totalWears} />
            <StatsCard title="Avg Wears/Item" value={stats.averageWears.toFixed(1)} />
            <StatsCard title="Never Worn" value={stats.neverWorn.length} />
          </div>
        </section>

        {/* Personal Style Insights */}
        <section className={styles.section}>
          <Heading size="4" className={styles.sectionTitle}>
            Personal Style Insights
          </Heading>

          <div className={styles.subsection}>
            <Text size="3" weight="medium" className={styles.subsectionTitle}>
              Category Preferences
            </Text>
            <div className={styles.categoryList}>
              {stats.categoryWears.map((cat) => (
                <div key={cat.category} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <Text size="2" weight="medium">
                      {cat.category}
                    </Text>
                    <Text size="1" color="gray">
                      {cat.count} {cat.count === 1 ? 'item' : 'items'}
                    </Text>
                  </div>
                  <div className={styles.categoryWears}>
                    <Text size="2" weight="bold">
                      {cat.wears}
                    </Text>
                    <Text size="1" color="gray">
                      wears
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wear Patterns */}
        <section className={styles.section}>
          <Heading size="4" className={styles.sectionTitle}>
            Wear Patterns
          </Heading>

          {stats.mostWorn.length > 0 && (
            <div className={styles.subsection}>
              <Text size="3" weight="medium" className={styles.subsectionTitle}>
                Most Worn Items
              </Text>
              <div className={styles.itemList}>
                {stats.mostWorn.map((item, index) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemRank}>
                      <Text size="2" weight="bold" color="gray">
                        #{index + 1}
                      </Text>
                    </div>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.leastWorn.length > 0 && (
            <div className={styles.subsection}>
              <Text size="3" weight="medium" className={styles.subsectionTitle}>
                Least Worn Items
              </Text>
              <div className={styles.itemList}>
                {stats.leastWorn.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.neverWorn.length > 0 && <NeverWornSection items={stats.neverWorn} />}
        </section>

        {/* Financial Insights */}
        <section className={styles.section}>
          <Heading size="4" className={styles.sectionTitle}>
            Financial Insights
          </Heading>

          <div className={styles.statsGrid}>
            <StatsCard title="Total Value" value={stats.totalValue.toFixed(0)} />
            <StatsCard
              title="Avg Cost/Wear"
              value={
                stats.avgCostPerWear !== null ? `${stats.avgCostPerWear.toFixed(2)} kr` : 'N/A'
              }
            />
            <StatsCard title="Second-Hand" value={stats.secondHandPercentage.toFixed(0)} />
          </div>

          {stats.bestValue.length > 0 && (
            <div className={styles.subsection}>
              <Text size="3" weight="medium" className={styles.subsectionTitle}>
                Best Value Items
              </Text>
              <div className={styles.itemList}>
                {stats.bestValue.map(({ item, costPerWear }) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemImage}>
                      <img src={item.imageUrl} alt={item.brand || 'Item'} />
                    </div>
                    <div className={styles.itemInfo}>
                      <Text size="2" weight="medium">
                        {item.brand || 'Unnamed'}
                      </Text>
                      <Text size="1" color="gray">
                        {item.wearCount} wears
                      </Text>
                    </div>
                    <div className={styles.itemWears}>
                      <Text size="3" weight="bold" color="green">
                        {costPerWear.toFixed(2)} kr
                      </Text>
                      <Text size="1" color="gray">
                        per wear
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
