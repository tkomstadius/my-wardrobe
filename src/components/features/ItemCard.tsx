import { PlusIcon } from "@radix-ui/react-icons";
import { IconButton, Badge } from "@radix-ui/themes";
import { Link } from "react-router";
import { useWardrobe } from "../../contexts/WardrobeContext";
import type { WardrobeItem } from "../../types/wardrobe";
import { formatItemAge } from "../../utils/dateFormatter";
import styles from "./ItemCard.module.css";

interface ItemCardProps {
  item: WardrobeItem;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const { incrementWearCount } = useWardrobe();

  // Calculate cost per wear if price exists and wear count > 0
  const costPerWear =
    item.price !== undefined && item.wearCount > 0
      ? item.price / item.wearCount
      : null;

  const handleQuickWear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await incrementWearCount(item.id);
    } catch (err) {
      console.error("Failed to increment wear count:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  const content = (
    <div
      className={styles.card}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={styles.imageContainer}>
        <img
          src={item.imageUrl}
          alt={item.brand || "Wardrobe item"}
          className={styles.image}
        />
        <IconButton
          size="2"
          variant="solid"
          className={styles.quickWearButton}
          onClick={handleQuickWear}
          title="Mark as worn"
        >
          <PlusIcon />
        </IconButton>
      </div>
      <div className={styles.content}>
        <p className={styles.details}>
          {item.brand && <span className={styles.brand}>{item.brand}</span>}
        </p>
        <div className={styles.metadata}>
          {item.price !== undefined && (
            <span className={styles.price}>{item.price.toFixed(2)} kr</span>
          )}
          {item.isSecondHand && <Badge color="amber">Thrifted</Badge>}
          {item.isDogCasual && <Badge color="cyan">Casual</Badge>}
          {item.isHandmade && <Badge color="green">Handmade</Badge>}
          {item.purchaseDate && (
            <span className={styles.itemAge}>
              {formatItemAge(item.purchaseDate)}
            </span>
          )}
          <span className={styles.wearCount}>Worn {item.wearCount}×</span>
          {costPerWear !== null && (
            <span className={styles.costPerWear}>
              {costPerWear.toFixed(2)} kr/wear
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // If onClick is provided, use div, otherwise wrap in Link
  if (onClick) {
    return content;
  }

  return (
    <Link to={`/item/${item.id}`} className={styles.cardLink}>
      {content}
    </Link>
  );
}
