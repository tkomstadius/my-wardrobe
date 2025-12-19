import { PlusIcon } from "@radix-ui/react-icons";
import { Link } from "react-router";
import { useWardrobe } from "../../contexts/WardrobeContext";
import type { WardrobeItem } from "../../types/wardrobe";
import { formatItemAge } from "../../utils/dateFormatter";
import { isWornToday } from "../../utils/wardrobeFilters";
import styles from "./ItemCard.module.css";
import { useState } from "react";

interface ItemCardProps {
  item: WardrobeItem;
  compact?: boolean;
}

export function ItemCard({ item, compact = false }: ItemCardProps) {
  const { incrementWearCount } = useWardrobe();
  const [isIncremented, setIsIncremented] = useState(false);

  const wornToday = isWornToday(item);

  const handleQuickWear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await incrementWearCount(item.id);
      setIsIncremented(true);
    } catch (err) {
      console.error("Failed to increment wear count:", err);
    }
  };

  const costPerWear =
    item.price !== undefined && item.wearCount > 0
      ? item.price / item.wearCount
      : null;

  return (
    <Link to={`/item/${item.id}`} className={styles.cardLink}>
      <div
        className={`${styles.card} ${compact ? styles.compact : ""}`}
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
              <p className={styles.wearCount}>
                Worn {item.wearCount + (isIncremented ? 1 : 0)}×
              </p>
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
            {costPerWear && (
              <p className={styles.costPerWear}>
                {costPerWear?.toFixed(2)} kr/wear
              </p>
            )}
            <button
              className={`${styles.quickWearButton} ${
                wornToday ? styles.disabled : ""
              }`}
              onClick={handleQuickWear}
              disabled={isIncremented}
              title={wornToday ? "Already worn today" : "Mark as worn"}
            >
              <PlusIcon />
            </button>
          </>
        )}
      </div>
    </Link>
  );
}
