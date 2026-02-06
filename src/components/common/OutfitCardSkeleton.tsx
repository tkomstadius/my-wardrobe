import styles from './OutfitCardSkeleton.module.css';
import { Skeleton } from './ui/Skeleton';

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export function OutfitCardSkeleton() {
  return (
    <div className={styles.card}>
      <Skeleton className={styles.image} />
      <div className={styles.content}>
        <Skeleton width="60%" height={12} />
        <Skeleton width="40%" height={10} />
      </div>
    </div>
  );
}

export function OutfitGridSkeleton() {
  return (
    <div className={styles.grid}>
      {SKELETON_KEYS.map((key) => (
        <OutfitCardSkeleton key={key} />
      ))}
    </div>
  );
}
