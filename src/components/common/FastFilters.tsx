import { Badge } from "@radix-ui/themes";
import type { ItemCategory } from "../../types/wardrobe";
import { getSubCategoriesForCategory } from "../../utils/categories";
import styles from "./FastFilters.module.css";

export type BooleanFilter = "secondhand" | "dogCasual" | "handmade";

interface FastFiltersProps {
  category: ItemCategory;
  selectedBooleanFilters: Set<BooleanFilter>;
  selectedSubCategory: string | null;
  onBooleanFilterToggle: (filter: BooleanFilter) => void;
  onSubCategoryFilterChange: (subCategory: string | null) => void;
  itemCounts?: {
    secondhand?: number;
    dogCasual?: number;
    handmade?: number;
    subCategories?: Record<string, number>;
  };
}

export function FastFilters({
  category,
  selectedBooleanFilters,
  selectedSubCategory,
  onBooleanFilterToggle,
  onSubCategoryFilterChange,
  itemCounts,
}: FastFiltersProps) {
  const availableSubCategories = getSubCategoriesForCategory(category);

  return (
    <div className={styles.container}>
      {/* Boolean Filters */}
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Quick Filters:</span>
        <div className={styles.filterButtons}>
          <button
            type="button"
            className={`${styles.filterButton} ${
              selectedBooleanFilters.has("secondhand")
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() => onBooleanFilterToggle("secondhand")}
            aria-pressed={selectedBooleanFilters.has("secondhand")}
          >
            <Badge color="amber" size="1">
              Thrifted
            </Badge>
            {itemCounts?.secondhand !== undefined && (
              <span className={styles.count}>({itemCounts.secondhand})</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              selectedBooleanFilters.has("dogCasual")
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() => onBooleanFilterToggle("dogCasual")}
            aria-pressed={selectedBooleanFilters.has("dogCasual")}
          >
            <Badge color="cyan" size="1">
              Dog Casual
            </Badge>
            {itemCounts?.dogCasual !== undefined && (
              <span className={styles.count}>({itemCounts.dogCasual})</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${
              selectedBooleanFilters.has("handmade")
                ? styles.filterButtonActive
                : ""
            }`}
            onClick={() => onBooleanFilterToggle("handmade")}
            aria-pressed={selectedBooleanFilters.has("handmade")}
          >
            <Badge color="green" size="1">
              Handmade
            </Badge>
            {itemCounts?.handmade !== undefined && (
              <span className={styles.count}>({itemCounts.handmade})</span>
            )}
          </button>
        </div>
      </div>

      {/* Subcategory Filters */}
      {availableSubCategories.length > 0 && (
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Subcategories:</span>
          <div className={styles.filterButtons}>
            <button
              type="button"
              className={`${styles.filterButton} ${
                selectedSubCategory === null ? styles.filterButtonActive : ""
              }`}
              onClick={() => onSubCategoryFilterChange(null)}
              aria-pressed={selectedSubCategory === null}
            >
              All
            </button>
            {availableSubCategories.map((subCategory) => {
              const count = itemCounts?.subCategories?.[subCategory];
              return (
                <button
                  key={subCategory}
                  type="button"
                  className={`${styles.filterButton} ${
                    selectedSubCategory === subCategory
                      ? styles.filterButtonActive
                      : ""
                  }`}
                  onClick={() => onSubCategoryFilterChange(subCategory)}
                  aria-pressed={selectedSubCategory === subCategory}
                >
                  {subCategory}
                  {count !== undefined && (
                    <span className={styles.count}>({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
