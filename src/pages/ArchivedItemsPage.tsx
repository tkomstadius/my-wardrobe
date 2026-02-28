import type { LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';
import { BackLink } from '../components/common/BackLink';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import type { WardrobeItem } from '../types/wardrobe';
import { formatDateDisplay } from '../utils/dateFormatter';
import { loadArchivedItems } from '../utils/storageCommands';
import styles from './ArchivedItemsPage.module.css';

export async function loader(_args: LoaderFunctionArgs) {
  const items = await loadArchivedItems();
  return { items };
}

const ARCHIVE_REASON_LABELS: Record<string, string> = {
  thrown_away: 'Thrown Away',
  donated: 'Donated',
  sold: 'Sold',
};

function ArchivedItemCard({ item }: { item: WardrobeItem }) {
  const reasonLabel = item.archiveReason ? (ARCHIVE_REASON_LABELS[item.archiveReason] ?? '') : '';

  return (
    <Link to={`/item/${item.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          <img src={item.imageUrl} alt={item.brand || 'Archived item'} className={styles.image} />
          {reasonLabel && <span className={styles.reasonBadge}>{reasonLabel}</span>}
        </div>
        <div className={styles.cardInfo}>
          {item.brand && <p className={styles.brand}>{item.brand}</p>}
          {item.archivedAt && (
            <p className={styles.archivedDate}>{formatDateDisplay(item.archivedAt)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ArchivedItemsPage() {
  const { items } = useLoaderData<typeof loader>();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackLink to="/items" />
        <Heading size="5" className={styles.title}>
          Archived
        </Heading>
        <div className={styles.spacer} />
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size="3" color="gray">
            No archived items yet.
          </Text>
          <Text size="2" color="gray">
            Archive items from their detail page when you no longer wear them.
          </Text>
        </div>
      ) : (
        <>
          <Text size="2" color="gray" className={styles.count}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
          <div className={styles.grid}>
            {items.map((item) => (
              <ArchivedItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
