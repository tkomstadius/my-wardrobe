import { useEffect, useState } from 'react';
import {
  IoAddCircleOutline,
  IoArchiveOutline,
  IoBarChartOutline,
  IoEllipsisHorizontalOutline,
  IoHomeOutline,
  IoLayersOutline,
  IoOptionsOutline,
  IoSettingsOutline,
} from 'react-icons/io5';
import { Link, useLocation } from 'react-router';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [showMore, setShowMore] = useState(false);

  const isOnItemsOrCategoryPage =
    (currentPath === '/items' || currentPath.startsWith('/items/')) &&
    currentPath !== '/items/archived';
  const isOnMoreSection =
    currentPath === '/stats' || currentPath === '/settings' || currentPath === '/items/archived';

  // Close menu on navigation
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger, not a closure dep
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  return (
    <>
      {showMore && (
        <div
          className={styles.menuBackdrop}
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {showMore && (
        <div className={styles.moreMenu} role="menu">
          <Link
            to="/stats"
            className={styles.moreMenuItem}
            role="menuitem"
            onClick={() => setShowMore(false)}
          >
            <IoBarChartOutline className={styles.moreMenuIcon} />
            <span className={styles.moreMenuLabel}>Statistics</span>
          </Link>
          <Link
            to="/items/archived"
            className={styles.moreMenuItem}
            role="menuitem"
            onClick={() => setShowMore(false)}
          >
            <IoLayersOutline className={styles.moreMenuIcon} />
            <span className={styles.moreMenuLabel}>Archived Items</span>
          </Link>
          <Link
            to="/settings"
            className={styles.moreMenuItem}
            role="menuitem"
            onClick={() => setShowMore(false)}
          >
            <IoSettingsOutline className={styles.moreMenuIcon} />
            <span className={styles.moreMenuLabel}>Settings</span>
          </Link>
        </div>
      )}

      <nav className={styles.bottomNav}>
        <Link to="/" className={`${styles.navItem} ${currentPath === '/' ? styles.active : ''}`}>
          <IoHomeOutline className={styles.icon} />
          <span className={styles.label}>Home</span>
        </Link>

        <Link
          to="/items"
          className={`${styles.navItem} ${isOnItemsOrCategoryPage ? styles.active : ''}`}
        >
          <IoArchiveOutline className={styles.icon} />
          <span className={styles.label}>Items</span>
        </Link>

        <Link
          to="/outfits"
          className={`${styles.navItem} ${
            currentPath.startsWith('/outfits') || currentPath === '/create-outfit'
              ? styles.active
              : ''
          }`}
        >
          <IoOptionsOutline className={styles.icon} />
          <span className={styles.label}>Outfits</span>
        </Link>

        <Link
          to="/log-wear"
          className={`${styles.navItem} ${currentPath === '/log-wear' ? styles.active : ''}`}
        >
          <IoAddCircleOutline className={styles.icon} />
          <span className={styles.label}>Log Wear</span>
        </Link>

        <button
          type="button"
          className={`${styles.navItem} ${isOnMoreSection || showMore ? styles.active : ''}`}
          onClick={() => setShowMore((prev) => !prev)}
        >
          <IoEllipsisHorizontalOutline className={styles.icon} />
          <span className={styles.label}>More</span>
        </button>
      </nav>
    </>
  );
}
