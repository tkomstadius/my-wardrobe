import { useState } from 'react';
import { IoAddOutline, IoPencilOutline } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router';
import type { WardrobeItem } from '../../types/wardrobe';
import { incrementWearCount } from '../../utils/storageCommands';
import { isWornToday } from '../../utils/wardrobeFilters';
import styles from './ItemCard.module.css';

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
      console.error('Failed to increment wear count:', err);
    }
  };

  const costPerWear =
    item.price !== undefined && item.wearCount > 0 ? item.price / item.wearCount : null;

  const tags = [
    item.isSecondHand && 'Thrifted',
    item.isDogCasual && 'Casual',
    item.isHandmade && 'Handmade',
  ].filter(Boolean);

  return (
    <Link to={`/item/${item.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          <img src={item.imageUrl} alt={item.brand || 'Wardrobe item'} className={styles.image} />
        </div>

        <div className={styles.footer}>
          <div className={styles.info}>
            {item.brand && <p className={styles.brand}>{item.brand}</p>}
            <p className={styles.meta}>
              Worn {newWearCount ?? item.wearCount}×{tags.length > 0 && ` · ${tags.join(' · ')}`}
              {costPerWear !== null && ` · ${costPerWear.toFixed(2)} kr/w`}
            </p>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.quickEditButton}
              onClick={handleQuickEdit}
              title="Edit item"
            >
              <IoPencilOutline />
            </button>
            <button
              type="button"
              className={`${styles.quickWearButton} ${wornToday ? styles.disabled : ''}`}
              onClick={handleQuickWear}
              disabled={!!newWearCount}
              title={wornToday ? 'Already worn today' : 'Mark as worn'}
            >
              <IoAddOutline />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
