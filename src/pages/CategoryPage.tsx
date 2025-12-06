import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@radix-ui/themes";
import { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ItemCard } from "../components/features/ItemCard";
import { useWardrobe } from "../contexts/WardrobeContext";
import type { ItemCategory } from "../types/wardrobe";
import { CATEGORY_TITLES } from "../utils/categories";
import styles from "./CategoryPage.module.css";

type FilterType = "all" | "thrifted" | "casual" | "recent" | "most-worn";

export function CategoryPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const { getItemsByCategory, isLoading } = useWardrobe();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

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

  // Filter items based on active filter
  const filteredItems = useMemo(() => {
    let items = [...categoryItems];

    switch (activeFilter) {
      case "thrifted":
        items = items.filter((item) => item.isSecondHand);
        break;
      case "casual":
        items = items.filter((item) => item.isDogCasual);
        break;
      case "recent":
        items = items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "most-worn":
        items = items.sort((a, b) => b.wearCount - a.wearCount);
        break;
      case "all":
      default:
        // No filtering, show all items in default order
        break;
    }

    return items;
  }, [categoryItems, activeFilter]);

  const hasItems = categoryItems.length > 0;
  const hasFilteredItems = filteredItems.length > 0;

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

          {/* Filter Buttons */}
          <div className={styles.filtersContainer}>
            <div className={styles.filters}>
              <Button
                size="2"
                variant={activeFilter === "all" ? "solid" : "soft"}
                onClick={() => setActiveFilter("all")}
                className={styles.filterButton}
              >
                All
              </Button>
              <Button
                size="2"
                variant={activeFilter === "thrifted" ? "solid" : "soft"}
                color="amber"
                onClick={() => setActiveFilter("thrifted")}
                className={styles.filterButton}
              >
                Thrifted
              </Button>
              <Button
                size="2"
                variant={activeFilter === "casual" ? "solid" : "soft"}
                color="cyan"
                onClick={() => setActiveFilter("casual")}
                className={styles.filterButton}
              >
                Casual
              </Button>
              <Button
                size="2"
                variant={activeFilter === "recent" ? "solid" : "soft"}
                color="purple"
                onClick={() => setActiveFilter("recent")}
                className={styles.filterButton}
              >
                Recent
              </Button>
              <Button
                size="2"
                variant={activeFilter === "most-worn" ? "solid" : "soft"}
                color="green"
                onClick={() => setActiveFilter("most-worn")}
                className={styles.filterButton}
              >
                Most Worn
              </Button>
            </div>
          </div>

          {hasFilteredItems ? (
            <div className={styles.grid}>
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className={styles.noResultsState}>
              <Text size="2" color="gray">
                No items match this filter
              </Text>
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => navigate("/add-item")}
        aria-label="Add item"
      >
        <PlusIcon className={styles.fabIcon} />
      </button>
    </div>
  );
}
