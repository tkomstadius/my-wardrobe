import { Link } from "react-router";
import type { WardrobeItem } from "../../types/wardrobe";
import { formatDateDisplay } from "../../utils/dateFormatter";
import styles from "./ItemCard.module.css";

interface ItemCardProps {
  item: WardrobeItem;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const content = (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageContainer}>
        <img
          src={item.imageUrl}
          alt={`${item.type} - ${item.color}`}
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.type}>{item.type}</h3>
        <p className={styles.details}>
          {item.color && <span className={styles.color}>{item.color}</span>}
          {item.brand && (
            <span className={styles.brand}>
              {item.color ? " • " : ""}
              {item.brand}
            </span>
          )}
        </p>
        <div className={styles.metadata}>
          {item.price !== undefined && (
            <span className={styles.price}>{item.price.toFixed(2)} kr</span>
          )}
          {item.isSecondHand && <span className={styles.badge}>Thrifted</span>}
          {item.purchaseDate && (
            <span className={styles.date}>
              {formatDateDisplay(item.purchaseDate)}
            </span>
          )}
          <span className={styles.wearCount}>Worn {item.wearCount}×</span>
        </div>
      </div>
    </div>
  );

  // If onClick is provided, use div, otherwise wrap in Link
  if (onClick) {
    return content;
  }

  return (
    <Link to={`/edit-item/${item.id}`} className={styles.cardLink}>
      {content}
    </Link>
  );
}
