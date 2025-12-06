import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@radix-ui/themes";
import { Link, useParams } from "react-router";
import { ItemCard } from "../components/features/ItemCard";
import { useWardrobe } from "../contexts/WardrobeContext";
import type { ItemCategory } from "../types/wardrobe";
import { CATEGORY_TITLES } from "../utils/categories";
import styles from "./CategoryPage.module.css";

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { getItemsByCategory, isLoading } = useWardrobe();

  // Validate category
  const isValidCategory = (cat: string | undefined): cat is ItemCategory => {
    return (
      cat !== undefined &&
      [
        "tops",
        "bottoms",
        "dresses",
        "outerwear",
        "shoes",
        "accessories",
      ].includes(cat)
    );
  };

  if (!isValidCategory(category)) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/">
            <Button variant="ghost" size="3">
              <ArrowLeftIcon />
              Back
            </Button>
          </Link>
        </div>
        <div className={styles.errorState}>
          <Text size="2" color="gray">
            Invalid category
          </Text>
        </div>
      </div>
    );
  }

  const categoryItems = getItemsByCategory(category);
  const title = CATEGORY_TITLES[category];
  const hasItems = categoryItems.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/">
          <Button variant="ghost" size="3">
            <ArrowLeftIcon />
            Back
          </Button>
        </Link>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.spacer} />
      </div>

      {isLoading && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            Loading...
          </Text>
        </div>
      )}

      {!isLoading && !hasItems && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No {title.toLowerCase()} yet. Add your first item!
          </Text>
          <Link to="/add-item" className={styles.addItemLink}>
            <Button size="2">Add Item</Button>
          </Link>
        </div>
      )}

      {!isLoading && hasItems && (
        <>
          <div className={styles.itemCount}>
            <Text size="2" color="gray">
              {categoryItems.length}{" "}
              {categoryItems.length === 1 ? "item" : "items"}
            </Text>
          </div>
          <div className={styles.grid}>
            {categoryItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
