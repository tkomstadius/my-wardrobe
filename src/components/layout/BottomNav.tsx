import {
  HomeIcon,
  PlusCircledIcon,
  MixerVerticalIcon,
  ArchiveIcon,
} from "@radix-ui/react-icons";
import { Link, useLocation } from "react-router";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isOnItemsOrCategoryPage =
    currentPath === "/items" || currentPath.startsWith("/category/");

  return (
    <nav className={styles.bottomNav}>
      <Link
        to="/"
        className={`${styles.navItem} ${
          currentPath === "/" ? styles.active : ""
        }`}
      >
        <HomeIcon className={styles.icon} />
        <span className={styles.label}>Home</span>
      </Link>

      <Link
        to="/items"
        className={`${styles.navItem} ${
          isOnItemsOrCategoryPage ? styles.active : ""
        }`}
      >
        <ArchiveIcon className={styles.icon} />
        <span className={styles.label}>Items</span>
      </Link>

      <Link
        to="/outfits"
        className={`${styles.navItem} ${
          currentPath.startsWith("/outfits") || currentPath === "/create-outfit"
            ? styles.active
            : ""
        }`}
      >
        <MixerVerticalIcon className={styles.icon} />
        <span className={styles.label}>Outfits</span>
      </Link>

      <Link
        to="/log-wear"
        className={`${styles.navItem} ${
          currentPath === "/log-wear" ? styles.active : ""
        }`}
      >
        <PlusCircledIcon className={styles.icon} />
        <span className={styles.label}>Log Wear</span>
      </Link>
    </nav>
  );
}
