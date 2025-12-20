import { Button, Text } from "@radix-ui/themes";
import { useState, useMemo } from "react";
import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { ItemCard } from "../components/common/ItemCard";
import { SearchBar } from "../components/common/SearchBar";
import {
  QuickFilters,
  type BooleanFilter,
} from "../components/common/QuickFilters";
import { useItemSearch } from "../hooks/useItemSearch";
import type { ItemCategory } from "../types/wardrobe";
import {
  CATEGORY_TITLES,
  CATEGORY_IDS,
  getSubCategoriesForCategory,
} from "../utils/categories";
import { loadItems } from "../utils/storage";
import styles from "./ItemCategoryPage.module.css";
import { Fab } from "../components/common/Fab";
import { BackLink } from "../components/common/BackLink";

export async function loader({ params }: LoaderFunctionArgs) {
  const { category } = params;

  const isValidItemCategory =
    category && CATEGORY_IDS.includes(category as ItemCategory);

  if (!isValidItemCategory) {
    return { items: [], category: null, title: null, isValid: false };
  }

  // TODO: add loading items by category
  const allItems = await loadItems();
  const categoryItems = allItems.filter((item) => item.category === category);

  return {
    items: categoryItems,
    category: category as ItemCategory,
    title: CATEGORY_TITLES[category as ItemCategory],
    isValid: true,
  };
}

export function ItemCategoryPage() {
  const {
    items: categoryItems,
    category,
    title,
    isValid,
  } = useLoaderData<typeof loader>();

  const [selectedBooleanFilters, setSelectedBooleanFilters] = useState<
    Set<BooleanFilter>
  >(new Set());
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null
  );

  // Apply fast filters first
  const fastFilteredItems = useMemo(() => {
    return categoryItems.filter((item) => {
      // Boolean filters
      if (selectedBooleanFilters.size > 0) {
        const matchesBooleanFilter =
          (selectedBooleanFilters.has("secondhand") && item.isSecondHand) ||
          (selectedBooleanFilters.has("dogCasual") && item.isDogCasual) ||
          (selectedBooleanFilters.has("handmade") && item.isHandmade);

        if (!matchesBooleanFilter) {
          return false;
        }
      }

      // Subcategory filter
      if (selectedSubCategory !== null) {
        if (item.subCategory !== selectedSubCategory) {
          return false;
        }
      }

      return true;
    });
  }, [categoryItems, selectedBooleanFilters, selectedSubCategory]);

  // Then apply search
  const { searchQuery, setSearchQuery, clearSearch, filteredItems } =
    useItemSearch(fastFilteredItems);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      secondhand: categoryItems.filter((item) => item.isSecondHand).length,
      dogCasual: categoryItems.filter((item) => item.isDogCasual).length,
      handmade: categoryItems.filter((item) => item.isHandmade).length,
      subCategories: {} as Record<string, number>,
    };

    if (category) {
      const subCategories = getSubCategoriesForCategory(category);
      subCategories.forEach((subCategory) => {
        counts.subCategories[subCategory] = categoryItems.filter(
          (item) => item.subCategory === subCategory
        ).length;
      });
    }

    return counts;
  }, [categoryItems, category]);

  const handleBooleanFilterToggle = (filter: BooleanFilter) => {
    setSelectedBooleanFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const handleSubCategoryFilterChange = (subCategory: string | null) => {
    setSelectedSubCategory(subCategory);
  };

  const hasItems = categoryItems.length > 0;
  const hasFilteredItems = filteredItems.length > 0;

  if (!isValid) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BackLink to={"/items"} />
        </div>
        <div className={styles.errorState}>
          <Text size="2" color="gray">
            Invalid category
          </Text>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <BackLink to={"/items"} />
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.spacer} />
      </div>

      {!hasItems && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No {title?.toLowerCase()} yet. Add your first item!
          </Text>
          <Link to="/add-item" className={styles.addItemLink}>
            <Button size="2">Add Item</Button>
          </Link>
        </div>
      )}

      {hasItems && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="Search in this category..."
            resultCount={filteredItems.length}
          />

          {category && (
            <QuickFilters
              category={category}
              selectedBooleanFilters={selectedBooleanFilters}
              selectedSubCategory={selectedSubCategory}
              onBooleanFilterToggle={handleBooleanFilterToggle}
              onSubCategoryFilterChange={handleSubCategoryFilterChange}
              itemCounts={filterCounts}
            />
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
                {searchQuery
                  ? `No items match "${searchQuery}"`
                  : "No items found"}
              </Text>
              {searchQuery && (
                <Text size="2" color="gray">
                  Try: brand names, colors, notes, or tags like "thrifted"
                </Text>
              )}
            </div>
          )}
        </>
      )}

      <Fab path="/add-item" />
    </>
  );
}
