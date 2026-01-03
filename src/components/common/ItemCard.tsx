import { Pencil1Icon, PlusIcon } from "@radix-ui/react-icons";
import { Link, useNavigate } from "react-router";
import type { WardrobeItem } from "../../types/wardrobe";
import { formatItemAge } from "../../utils/dateFormatter";
import { isWornToday } from "../../utils/wardrobeFilters";
import styles from "./ItemCard.module.css";
import { useState } from "react";
import { incrementWearCount } from "../../utils/storageCommands";

interface ItemCardProps {
  item: WardrobeItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate();
  const [newWearCount, setNewWearCount] = useState<number>();

  const wornToday = isWornToday(item);

  const handleQuickEdit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit-item/${item.id}`);
  };

  const handleQuickWear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const newCount = await incrementWearCount(item.id);
      setNewWearCount(newCount);
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
      <div className={styles.card} role="button" tabIndex={0}>
        <div className={styles.imageContainer}>
          <img
            src={item.imageUrl}
            alt={item.brand || "Wardrobe item"}
            className={styles.image}
          />
        </div>

        <div className={styles.content}>
          {item.brand && <p className={styles.brand}>{item.brand}</p>}
          <p className={styles.wearCount}>
            Worn {newWearCount ?? item.wearCount}×
          </p>
          <div className={styles.metadata}>
            {item.isSecondHand && <p>Thrifted</p>}
            {item.isDogCasual && <p>Casual</p>}
            {item.isHandmade && <p>Handmade</p>}
          </div>
          {item.purchaseDate && (
            <p className={styles.itemAge}>{formatItemAge(item.purchaseDate)}</p>
          )}
        </div>
        {costPerWear !== null && (
          <p className={styles.costPerWear}>
            {costPerWear?.toFixed(2)} kr/wear
          </p>
        )}
        <button
          className={styles.quickEditButton}
          onClick={handleQuickEdit}
          title={"Edit item"}
        >
          <Pencil1Icon />
        </button>

        <button
          className={`${styles.quickWearButton} ${
            wornToday ? styles.disabled : ""
          }`}
          onClick={handleQuickWear}
          disabled={!!newWearCount}
          title={wornToday ? "Already worn today" : "Mark as worn"}
        >
          <PlusIcon />
        </button>
      </div>
    </Link>
  );
}
