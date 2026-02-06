import styles from './ItemCardSkeleton.module.css';
import { Skeleton } from './ui/Skeleton';

const SKELETON_KEYS = ['a', 'b', 'c'] as const;

export function ItemCardSkeleton() {
  return (
    <div className={styles.card}>
      <Skeleton width={70} height={70} borderRadius="var(--border-radius)" />
      <div className={styles.content}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="30%" height={10} />
      </div>
      <Skeleton width={36} height={36} borderRadius="50%" />
      <Skeleton width={36} height={36} borderRadius="50%" />
    </div>
  );
}

export function ItemCardSkeletonList() {
  return (
    <div className={styles.list}>
      {SKELETON_KEYS.map((key) => (
        <ItemCardSkeleton key={key} />
      ))}
    </div>
  );
}
