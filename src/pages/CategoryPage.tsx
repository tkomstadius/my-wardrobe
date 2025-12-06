import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { Button, Text, Select } from "@radix-ui/themes";
import { useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ItemCard } from "../components/features/ItemCard";
import { useWardrobe } from "../contexts/WardrobeContext";
import type { ItemCategory } from "../types/wardrobe";
import { CATEGORY_TITLES, CATEGORY_IDS } from "../utils/categories";
import { FILTERS, type FilterType } from "../utils/filters";
import styles from "./CategoryPage.module.css";

export function CategoryPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const { getItemsByCategory, isLoading } = useWardrobe();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");

  // Validate category
  const isValidCategory = (cat: string | undefined): cat is ItemCategory => {
    return cat !== undefined && CATEGORY_IDS.includes(cat as ItemCategory);
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

  // Get brands available in this category
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    for (const item of categoryItems) {
      if (item.brand?.trim()) {
        brands.add(item.brand.trim());
      }
    }
    return Array.from(brands).sort();
  }, [categoryItems]);

  // Filter items based on active filter and brand
  const filteredItems = useMemo(() => {
    let items = [...categoryItems];

    // Apply brand filter first
    if (selectedBrand !== "all") {
      items = items.filter((item) => item.brand === selectedBrand);
    }

    // Apply type filters
    switch (activeFilter) {
      case "thrifted":
        items = items.filter((item) => item.isSecondHand);
        break;
      case "casual":
        items = items.filter((item) => item.isDogCasual);
        break;
      case "handmade":
        items = items.filter((item) => item.isHandmade);
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
  }, [categoryItems, activeFilter, selectedBrand]);

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
              {FILTERS.map((filter) => (
                <Button
                  key={filter.id}
                  size="2"
                  variant={activeFilter === filter.id ? "solid" : "soft"}
                  color={filter.color}
                  onClick={() => setActiveFilter(filter.id)}
                  className={styles.filterButton}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className={styles.brandFilterContainer}>
              <Text
                size="2"
                weight="medium"
                className={styles.brandFilterLabel}
              >
                Brand:
              </Text>
              <Select.Root
                value={selectedBrand}
                onValueChange={setSelectedBrand}
              >
                <Select.Trigger className={styles.brandSelect} />
                <Select.Content>
                  <Select.Item value="all">All Brands</Select.Item>
                  {availableBrands.map((brand) => (
                    <Select.Item key={brand} value={brand}>
                      {brand}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          )}

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
