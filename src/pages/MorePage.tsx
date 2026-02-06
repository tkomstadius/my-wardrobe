import { IoBarChartOutline, IoChevronForward, IoSettingsOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import styles from './MorePage.module.css';

export function MorePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>More</h1>

      <nav className={styles.menu}>
        <Link to="/stats" className={styles.menuItem}>
          <div className={styles.menuIcon}>
            <IoBarChartOutline size={24} />
          </div>
          <div className={styles.menuContent}>
            <span className={styles.menuLabel}>Statistics</span>
            <span className={styles.menuDescription}>View wardrobe analytics and insights</span>
          </div>
          <IoChevronForward size={20} className={styles.chevron} />
        </Link>

        <Link to="/settings" className={styles.menuItem}>
          <div className={styles.menuIcon}>
            <IoSettingsOutline size={24} />
          </div>
          <div className={styles.menuContent}>
            <span className={styles.menuLabel}>Settings</span>
            <span className={styles.menuDescription}>
              Backup, AI preferences, and data management
            </span>
          </div>
          <IoChevronForward size={20} className={styles.chevron} />
        </Link>
      </nav>
    </div>
  );
}
