import { useState } from 'react';
import { Link } from 'react-router';
import type { FullStats, YearlySpendingStat } from '../../utils/statsCalculations';
import { StatsCard } from '../common/StatsCard';
import { Heading } from '../common/ui/Heading';
import { Text } from '../common/ui/Text';
import styles from './FinancialInsightsSection.module.css';

interface FinancialInsightsSectionProps {
  stats: FullStats;
  yearlySpending: YearlySpendingStat[];
}

export function FinancialInsightsSection({ stats, yearlySpending }: FinancialInsightsSectionProps) {
  const [showFinancial, setShowFinancial] = useState(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  return (
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
            <StatsCard title="Second-Hand" value={`${stats.secondHandPercentage.toFixed(0)}%`} />
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

          {yearlySpending.length > 0 && (
            <div className={styles.subsection}>
              <Text size="2" weight="medium" className={styles.subsectionTitle}>
                Spending by Year
              </Text>
              <div className={styles.yearlyList}>
                {yearlySpending.map((row) => (
                  <div key={row.year}>
                    <button
                      type="button"
                      className={`${styles.yearlyRow} ${expandedYear === row.year ? styles.yearlyRowActive : ''}`}
                      onClick={() =>
                        setExpandedYear((prev) => (prev === row.year ? null : row.year))
                      }
                    >
                      <Text size="2" weight="medium" className={styles.yearlyYear}>
                        {row.year}
                      </Text>
                      <div className={styles.yearlyMeta}>
                        <Text size="1" color="gray">
                          {row.itemCount} {row.itemCount === 1 ? 'item' : 'items'}
                        </Text>
                      </div>
                      <Text size="2" weight="medium" className={styles.yearlyAmount}>
                        {row.itemsWithPrice > 0 ? `${row.totalSpent.toFixed(0)} kr` : '—'}
                      </Text>
                      <Text size="1" color="gray" className={styles.yearlyChevron}>
                        {expandedYear === row.year ? '▲' : '▼'}
                      </Text>
                    </button>
                    {expandedYear === row.year && (
                      <div className={styles.yearlyItems}>
                        {row.items.map((item) => (
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
                              {item.price !== undefined && item.price > 0 ? (
                                <Text size="2" weight="medium">
                                  {item.price.toFixed(0)} kr
                                </Text>
                              ) : (
                                <Text size="2" color="gray">
                                  —
                                </Text>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
