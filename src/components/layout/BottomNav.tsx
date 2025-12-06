import {
  HomeIcon,
  PlusIcon,
  MixIcon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { DropdownMenu } from "@radix-ui/themes";
import { Link, useLocation, useNavigate } from "react-router";
import type { ItemCategory } from "../../types/wardrobe";
import styles from "./BottomNav.module.css";

const CATEGORIES: Array<{ id: ItemCategory; title: string }> = [
  { id: "tops", title: "Tops" },
  { id: "bottoms", title: "Bottoms" },
  { id: "dresses", title: "Dresses & Jumpsuits" },
  { id: "outerwear", title: "Outerwear" },
  { id: "shoes", title: "Shoes" },
  { id: "accessories", title: "Accessories" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isOnCategoryPage = currentPath.startsWith("/category/");

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

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <button
            className={`${styles.navItem} ${styles.categoriesButton} ${
              isOnCategoryPage ? styles.active : ""
            }`}
            type="button"
          >
            <HamburgerMenuIcon className={styles.icon} />
            <span className={styles.label}>Categories</span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content size="2" className={styles.dropdownContent}>
          {CATEGORIES.map((category) => (
            <DropdownMenu.Item
              key={category.id}
              onSelect={() => navigate(`/category/${category.id}`)}
            >
              {category.title}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Link to="/add-item" className={styles.navItem}>
        <div className={styles.addButton}>
          <PlusIcon className={styles.addIcon} />
        </div>
        <span className={styles.label}>Add Item</span>
      </Link>

      <Link
        to="/outfits"
        className={`${styles.navItem} ${
          currentPath.startsWith("/outfits") || currentPath === "/create-outfit"
            ? styles.active
            : ""
        }`}
      >
        <MixIcon className={styles.icon} />
        <span className={styles.label}>Outfits</span>
      </Link>
    </nav>
  );
}
