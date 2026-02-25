import { Link, useLoaderData } from 'react-router';
import { Fab } from '../components/common/Fab';
import { Grid } from '../components/common/ui/Grid';
import { Text } from '../components/common/ui/Text';
import type { ItemCategory } from '../types/wardrobe';
import { CATEGORIES } from '../utils/categories';
import { loadItems } from '../utils/storageCommands';
import styles from './ItemsPage.module.css';

const CATEGORY_EMOJI: Record<ItemCategory, string> = {
  tops: '👕',
  bottoms: '👖',
  dresses: '👗',
  outerwear: '🧥',
  shoes: '👟',
  bags: '👜',
  jewelry: '💍',
  accessories: '🧢',
};

export async function loader() {
  try {
    const items = await loadItems();
    return { items, error: null };
  } catch (error) {
    console.error('Failed to load items:', error);
    return { items: [], error: error as string };
  }
}

export function ItemsPage() {
  const { items, error } = useLoaderData<typeof loader>();

  const countByCategory = (categoryId: string) =>
    items.filter((item) => item.category === categoryId).length;

  if (error) {
    return (
      <Text size="2" color="red">
        Could not load items.
      </Text>
    );
  }

  return (
    <>
      <Grid columns="2" gap="3">
        {CATEGORIES.map((category) => {
          const count = countByCategory(category.id);
          return (
            <Link key={category.id} to={`/items/${category.id}`} className={styles.categoryCard}>
              <span className={styles.categoryIcon}>{CATEGORY_EMOJI[category.id]}</span>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
              <Text size="1" color="gray">
                {count} {count === 1 ? 'item' : 'items'}
              </Text>
            </Link>
          );
        })}
      </Grid>

      <Fab path="/add-item" />
    </>
  );
}
