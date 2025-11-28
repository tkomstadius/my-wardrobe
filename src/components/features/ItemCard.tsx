import { Link } from 'react-router';
import type { WardrobeItem } from '../../types/wardrobe';
import styles from './ItemCard.module.css';

interface ItemCardProps {
  item: WardrobeItem;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const content = (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageContainer}>
        <img src={item.imageUrl} alt={`${item.type} - ${item.color}`} className={styles.image} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.type}>{item.type}</h3>
        <p className={styles.details}>
          <span className={styles.color}>{item.color}</span>
          {item.brand && <span className={styles.brand}> • {item.brand}</span>}
        </p>
      </div>
    </div>
  );

  // If onClick is provided, use div, otherwise wrap in Link
  if (onClick) {
    return content;
  }

  return <Link to={`/edit-item/${item.id}`} className={styles.cardLink}>{content}</Link>;
}

