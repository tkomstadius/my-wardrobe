import styles from './StatsCard.module.css';
import { Text } from './ui/Text';

interface StatsCardProps {
  title: string;
  value: string | number;
}

export function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className={styles.container}>
      <Text size="1" className={styles.title}>
        {title}
      </Text>
      <Text size="5" weight="bold" className={styles.value}>
        {value}
      </Text>
    </div>
  );
}
