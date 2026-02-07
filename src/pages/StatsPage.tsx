import { useMemo, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { StatsCard } from '../components/common/StatsCard';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import type { WardrobeItem } from '../types/wardrobe';
import { calculateFullStats, type Season } from '../utils/statsCalculations';
import { loadItems } from '../utils/storageCommands';
import styles from './StatsPage.module.css';

const SEASON_EMOJI: Record<Season, string> = {
  winter: '\u2744\uFE0F',
  spring: '\uD83C\uDF38',
  summer: '\u2600\uFE0F',
  fall: '\uD83C\uDF42',
};

const NEVER_WORN_DEFAULT_LIMIT = 10;

type WearPatternView = 'most' | 'least' | 'never';

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
  const [wearView, setWearView] = useState<WearPatternView>('most');
  const [showFinancial, setShowFinancial] = useState(false);
  const [showSeasonal, setShowSeasonal] = useState(false);

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
        {/* Hero Stats - Focus on key metrics */}
        <section className={styles.heroSection}>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <Text size="1" className={styles.heroLabel}>
                Total Items
              </Text>
              <div className={styles.heroValue}>{stats.totalItems}</div>
            </div>
            <div className={styles.heroStat}>
              <Text size="1" className={styles.heroLabel}>
                Total Wears
              </Text>
              <div className={styles.heroValue}>{stats.totalWears}</div>
            </div>
            <div className={styles.heroStat}>
              <Text size="1" className={styles.heroLabel}>
                Never Worn
              </Text>
              <div
                className={`${styles.heroValue} ${stats.neverWorn.length > 0 ? styles.heroValueWarning : ''}`}
              >
                {stats.neverWorn.length}
              </div>
            </div>
          </div>
          <div className={styles.secondaryStats}>
            <StatsCard title="Avg Wears/Item" value={stats.averageWears.toFixed(1)} />
          </div>
        </section>

        {/* Wardrobe Insights - Combined section */}
        <section className={styles.section}>
          <Heading size="4" className={styles.sectionTitle}>
            Wardrobe Insights
          </Heading>

          {/* Category Preferences with visual bars */}
          <div className={styles.subsection}>
            <Text size="3" weight="medium" className={styles.subsectionTitle}>
              Category Activity
            </Text>
            <div className={styles.categoryList}>
              {stats.categoryWears.map((cat) => {
                const percentage = (cat.wears / stats.totalWears) * 100;
                return (
                  <div key={cat.category} className={styles.categoryItem}>
                    <div className={styles.categoryInfo}>
                      <Text size="2" weight="medium">
                        {cat.category}
                      </Text>
                      <Text size="1" color="gray">
                        {cat.count} {cat.count === 1 ? 'item' : 'items'} · {cat.wears} wears
                      </Text>
                    </div>
                    <div className={styles.categoryBar}>
                      <div className={styles.categoryBarFill} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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

          {/* Category Favorites - More actionable than overall favorites */}
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

        {/* Seasonal Wear - Collapsible */}
        {stats.seasonalWears.some((s) => s.wearCount > 0) && (
          <section className={styles.section}>
            <button
              type="button"
              className={styles.sectionToggle}
              onClick={() => setShowSeasonal(!showSeasonal)}
            >
              <Heading size="4" className={styles.sectionTitle}>
                Seasonal Breakdown
              </Heading>
              <Text size="2" className={styles.toggleIcon}>
                {showSeasonal ? '\u2212' : '+'}
              </Text>
            </button>

            {showSeasonal && (
              <>
                <div className={styles.seasonGrid}>
                  {stats.seasonalWears.map((season) => (
                    <div key={season.season} className={styles.seasonCard}>
                      <Text size="4">{SEASON_EMOJI[season.season]}</Text>
                      <Text size="1" weight="medium">
                        {season.label}
                      </Text>
                      <Text size="3" weight="bold">
                        {season.wearCount}
                      </Text>
                      <Text size="1" color="gray">
                        {season.percentage.toFixed(0)}%
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Top 3 items per season */}
                {(['winter', 'spring', 'summer', 'fall'] as Season[]).map((seasonKey) => {
                  const seasonLabel =
                    stats.seasonalWears.find((s) => s.season === seasonKey)?.label || seasonKey;
                  const seasonalItems = stats.seasonalItems
                    .filter((si) => si.dominantSeason === seasonKey)
                    .map((si) => {
                      const totalWears = Object.values(si.seasonCounts).reduce((a, b) => a + b, 0);
                      const seasonPercentage = Math.round(
                        (si.seasonCounts[seasonKey] / totalWears) * 100,
                      );
                      return { ...si, seasonPercentage };
                    })
                    .sort((a, b) => b.seasonPercentage - a.seasonPercentage)
                    .slice(0, 3);

                  if (seasonalItems.length === 0) return null;

                  return (
                    <div key={seasonKey} className={styles.subsection}>
                      <Text size="2" weight="medium" className={styles.subsectionTitle}>
                        {SEASON_EMOJI[seasonKey]} {seasonLabel}
                      </Text>
                      <div className={styles.itemList}>
                        {seasonalItems.map(({ item, seasonCounts, seasonPercentage }) => (
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
                              <Text size="2" weight="bold">
                                {seasonPercentage}%
                              </Text>
                              <Text size="1" color="gray">
                                ({seasonCounts[seasonKey]}×)
                              </Text>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}

        {/* Financial Insights - Collapsible */}
        <section className={styles.section}>
          <button
            type="button"
            className={styles.sectionToggle}
            onClick={() => setShowFinancial(!showFinancial)}
          >
            <Heading size="4" className={styles.sectionTitle}>
              Financial Insights
            </Heading>
            <Text size="2" className={styles.toggleIcon}>
              {showFinancial ? '\u2212' : '+'}
            </Text>
          </button>

          {showFinancial && (
            <>
              <div className={styles.statsGrid}>
                <StatsCard title="Total Value" value={`${stats.totalValue.toFixed(0)} kr`} />
                <StatsCard
                  title="Avg Cost/Wear"
                  value={
                    stats.avgCostPerWear !== null ? `${stats.avgCostPerWear.toFixed(2)} kr` : 'N/A'
                  }
                />
                <StatsCard
                  title="Second-Hand"
                  value={`${stats.secondHandPercentage.toFixed(0)}%`}
                />
              </div>

              {stats.bestValue.length > 0 && (
                <div className={styles.subsection}>
                  <Text size="2" weight="medium" className={styles.subsectionTitle}>
                    Best Value Items
                  </Text>
                  <div className={styles.itemList}>
                    {stats.bestValue.map(({ item, costPerWear }) => (
                      <Link key={item.id} to={`/item/${item.id}`} className={styles.itemRow}>
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
                          <Text size="2" weight="bold" color="green">
                            {costPerWear.toFixed(2)} kr
                          </Text>
                          <Text size="1" color="gray">
                            /wear
                          </Text>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
