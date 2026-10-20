import { useMemo } from 'react';
import { useLoaderData } from 'react-router';
import { CategoryItemsAccordion } from '../components/common/CategoryItemsAccordion';
import { Heading } from '../components/common/ui/Heading';
import { Text } from '../components/common/ui/Text';
import { NEGLECTED_ITEMS_THRESHOLD_DAYS } from '../utils/config';
import { loadItems } from '../utils/storageCommands';
import { getNeglectedItems } from '../utils/wardrobeFilters';
import styles from './NeglectedItemsPage.module.css';

export async function loader() {
  const items = await loadItems();
  return { items };
}

export function NeglectedItemsPage() {
  const { items } = useLoaderData<typeof loader>();
  const neglectedItems = useMemo(
    () => getNeglectedItems(items, NEGLECTED_ITEMS_THRESHOLD_DAYS),
    [items],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Heading size="6">Neglected items</Heading>
        <Text size="2" color="gray">
          Not worn in the last {NEGLECTED_ITEMS_THRESHOLD_DAYS} days
          {neglectedItems.length > 0 && ` · ${neglectedItems.length} items`}
        </Text>
      </div>

      {neglectedItems.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            Great job! All your items have been worn recently.
          </Text>
        </div>
      ) : (
        <CategoryItemsAccordion items={neglectedItems} />
      )}
    </div>
  );
}
