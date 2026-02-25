import type { FullStats } from '../../utils/statsCalculations';
import { StatsCard } from '../common/StatsCard';
import { Text } from '../common/ui/Text';
import styles from './HeroStatsSection.module.css';

interface HeroStatsSectionProps {
  stats: FullStats;
}

export function HeroStatsSection({ stats }: HeroStatsSectionProps) {
  return (
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
  );
}
