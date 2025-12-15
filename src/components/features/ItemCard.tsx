import { PlusIcon } from "@radix-ui/react-icons";
import { IconButton, Badge } from "@radix-ui/themes";
import { Link } from "react-router";
import { useWardrobe } from "../../contexts/WardrobeContext";
import type { WardrobeItem } from "../../types/wardrobe";
import { formatItemAge } from "../../utils/dateFormatter";
import { getTraitEmoji } from "../../utils/traits";
import { isWornToday } from "../../utils/wardrobeFilters";
import { CURRENCY } from "../../utils/config";
import styles from "./ItemCard.module.css";

interface ItemCardProps {
  item: WardrobeItem;
  onClick?: () => void;
  compact?: boolean;
}

export function ItemCard({ item, onClick, compact = false }: ItemCardProps) {
  const { incrementWearCount } = useWardrobe();

  // Calculate cost per wear if price exists and wear count > 0
  const costPerWear =
    item.price !== undefined && item.wearCount > 0
      ? item.price / item.wearCount
      : null;

  // Check if item was worn today
  const wornToday = isWornToday(item);

  const handleQuickWear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (wornToday) {
      return; // Already worn today, do nothing
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

  const traitEmoji = getTraitEmoji(item.trait);

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
        {!compact && (
          <IconButton
            size="2"
            variant="solid"
            className={`${styles.quickWearButton} ${
              wornToday ? styles.disabled : ""
            }`}
            onClick={handleQuickWear}
            disabled={wornToday}
            title={wornToday ? "Already worn today" : "Mark as worn"}
          >
            <PlusIcon />
          </IconButton>
        )}
      </div>
      {!compact && (
        <div className={styles.content}>
          <p className={styles.details}>
            {item.brand && <span className={styles.brand}>{item.brand}</span>}
          </p>
          <div className={styles.metadata}>
            {item.isSecondHand && <Badge color="amber">Thrifted</Badge>}
            {item.isDogCasual && <Badge color="cyan">Casual</Badge>}
            {item.isHandmade && <Badge color="green">Handmade</Badge>}
            {traitEmoji && (
              <span className={styles.traitEmoji} title={item.trait}>
                {traitEmoji}
              </span>
            )}
            {item.purchaseDate && (
              <span className={styles.itemAge}>
                {formatItemAge(item.purchaseDate)}
              </span>
            )}
            <span className={styles.wearCount}>Worn {item.wearCount}×</span>
            {costPerWear !== null && (
              <span className={styles.costPerWear}>
                {costPerWear.toFixed(2)} {CURRENCY}/wear
              </span>
            )}
          </div>
        </div>
      )}
      {compact && (
        <div className={styles.compactContent}>
          <span className={styles.compactWearCount}>{item.wearCount}×</span>
        </div>
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
