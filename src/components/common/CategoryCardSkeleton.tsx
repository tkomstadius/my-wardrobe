import styles from './CategoryCardSkeleton.module.css';
import { Skeleton } from './ui/Skeleton';

const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function CategoryCardSkeleton() {
  return (
    <div className={styles.card}>
      <Skeleton width="50%" height={14} />
      <div className={styles.previewGrid}>
        <Skeleton className={styles.previewItem} />
        <Skeleton className={styles.previewItem} />
        <Skeleton className={styles.previewItem} />
        <Skeleton className={styles.previewItem} />
      </div>
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className={styles.grid}>
      {SKELETON_KEYS.map((key) => (
        <CategoryCardSkeleton key={key} />
      ))}
    </div>
  );
}
