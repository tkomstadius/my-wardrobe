import {
  IoAddCircleOutline,
  IoArchiveOutline,
  IoEllipsisHorizontalOutline,
  IoHomeOutline,
  IoOptionsOutline,
} from 'react-icons/io5';
import { Link, useLocation } from 'react-router';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isOnItemsOrCategoryPage = currentPath === '/items' || currentPath.startsWith('/items/');
  const isOnMoreSection =
    currentPath === '/more' || currentPath === '/stats' || currentPath === '/settings';

  return (
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

      <Link to="/more" className={`${styles.navItem} ${isOnMoreSection ? styles.active : ''}`}>
        <IoEllipsisHorizontalOutline className={styles.icon} />
        <span className={styles.label}>More</span>
      </Link>
    </nav>
  );
}
