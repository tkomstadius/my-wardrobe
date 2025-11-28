import { PlusIcon } from '@radix-ui/react-icons';
import { Button, Text } from '@radix-ui/themes';
import { Link } from 'react-router';
import { useWardrobe } from '../contexts/WardrobeContext';
import type { ItemCategory } from '../types/wardrobe';
import styles from './HomePage.module.css';

const CATEGORIES: Array<{ id: ItemCategory; title: string }> = [
  { id: 'tops', title: 'Tops' },
  { id: 'bottoms', title: 'Bottoms' },
  { id: 'outerwear', title: 'Outerwear' },
  { id: 'accessories', title: 'Accessories' },
];

export function HomePage() {
  const { items, getItemsByCategory, isLoading } = useWardrobe();
  const hasItems = items.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Wardrobe</h2>
        <Link to="/add-item">
          <Button size="3">
            <PlusIcon />
            Add Item
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            Loading your wardrobe...
          </Text>
        </div>
      )}

      {!isLoading && !hasItems && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No items yet. Add your first wardrobe item to get started!
          </Text>
        </div>
      )}

      <div className={styles.categories}>
        {CATEGORIES.map((cat) => {
          const categoryItems = getItemsByCategory(cat.id);
          return (
            <CategoryCard
              key={cat.id}
              title={cat.title}
              count={categoryItems.length}
              category={cat.id}
              items={categoryItems}
            />
          );
        })}
      </div>
    </div>
  );
}

interface CategoryCardProps {
  title: string;
  count: number;
  category: string;
  items: Array<{ imageUrl: string; id: string }>;
}

function CategoryCard({ title, count, items }: CategoryCardProps) {
  const hasItems = items.length > 0;

  return (
    <div className={styles.categoryCard}>
      {hasItems && (
        <div className={styles.categoryPreview}>
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className={styles.previewImage}>
              <img src={item.imageUrl} alt="" />
            </div>
          ))}
        </div>
      )}
      <div className={styles.categoryContent}>
        <h3 className={styles.categoryTitle}>{title}</h3>
        <p className={styles.categoryCount}>
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </div>
    </div>
  );
}
