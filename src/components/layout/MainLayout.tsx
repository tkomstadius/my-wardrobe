import { Outlet } from 'react-router';
import styles from './MainLayout.module.css';

export function MainLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.logo}>WardrobeTracker</h1>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
