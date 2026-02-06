import styles from './ItemDetailSkeleton.module.css';
import { Skeleton } from './ui/Skeleton';

export function ItemDetailSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Skeleton width={32} height={32} borderRadius="50%" />
        <Skeleton width={120} height={24} />
        <Skeleton width={32} height={32} borderRadius="50%" />
      </div>

      <Skeleton className={styles.image} />

      <div className={styles.actions}>
        <Skeleton width="48%" height={44} borderRadius="var(--small-border-radius)" />
        <Skeleton width="48%" height={44} borderRadius="var(--small-border-radius)" />
      </div>

      <div className={styles.stats}>
        <Skeleton width="30%" height={48} borderRadius="var(--border-radius)" />
        <Skeleton width="30%" height={48} borderRadius="var(--border-radius)" />
        <Skeleton width="30%" height={48} borderRadius="var(--border-radius)" />
      </div>

      <div className={styles.details}>
        <Skeleton width="100%" height={60} borderRadius="var(--border-radius)" />
        <Skeleton width="100%" height={60} borderRadius="var(--border-radius)" />
      </div>
    </div>
  );
}
