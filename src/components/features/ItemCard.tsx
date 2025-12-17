import { PlusIcon } from "@radix-ui/react-icons";
import { Link } from "react-router";
import { useWardrobe } from "../../contexts/WardrobeContext";
import type { WardrobeItem } from "../../types/wardrobe";
import { formatItemAge } from "../../utils/dateFormatter";
import { isWornToday } from "../../utils/wardrobeFilters";
import styles from "./ItemCard.module.css";

interface ItemCardProps {
  item: WardrobeItem;
  onClick?: () => void;
  compact?: boolean;
}

export function ItemCard({ item, onClick, compact = false }: ItemCardProps) {
  const { incrementWearCount } = useWardrobe();

  const wornToday = isWornToday(item);

  const handleQuickWear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (wornToday) {
      return;
    }

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
      className={`${styles.card} ${compact ? styles.compact : ""}`}
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
      </div>
      {!compact && (
        <>
          <div className={styles.content}>
            {item.brand && <p className={styles.brand}>{item.brand}</p>}
            <p className={styles.wearCount}>Worn {item.wearCount}×</p>
            <div className={styles.metadata}>
              {item.isSecondHand && <p>Thrifted</p>}
              {item.isDogCasual && <p>Casual</p>}
              {item.isHandmade && <p>Handmade</p>}
            </div>
            {item.purchaseDate && (
              <p className={styles.itemAge}>
                {formatItemAge(item.purchaseDate)}
              </p>
            )}
          </div>
          <button
            className={`${styles.quickWearButton} ${
              wornToday ? styles.disabled : ""
            }`}
            onClick={handleQuickWear}
            disabled={wornToday}
            title={wornToday ? "Already worn today" : "Mark as worn"}
          >
            <PlusIcon />
          </button>
        </>
      )}
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
