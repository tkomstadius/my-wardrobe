import { Flex } from "./ui/Flex";
import type { ItemCategory } from "../../types/wardrobe";
import { getSubCategoriesForCategory } from "../../utils/categories";
import styles from "./QuickFilters.module.css";

export type BooleanFilter = "secondhand" | "dogCasual" | "handmade";

interface QuickFiltersProps {
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

export function QuickFilters({
  category,
  selectedBooleanFilters,
  selectedSubCategory,
  onBooleanFilterToggle,
  onSubCategoryFilterChange,
  itemCounts,
}: QuickFiltersProps) {
  const availableSubCategories = getSubCategoriesForCategory(category);

  return (
    <Flex direction="column" gap="2" style={{ marginBottom: "0.75rem" }}>
      <Flex gap="1">
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
          <span>♻️</span>
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
          <span>🐶</span>
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
          <span>🧶</span>
          {itemCounts?.handmade !== undefined && (
            <span className={styles.count}>({itemCounts.handmade})</span>
          )}
        </button>
      </Flex>

      {/* Subcategory Filters */}
      {availableSubCategories.length > 0 && (
        <Flex gap="1" wrap="wrap">
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
        </Flex>
      )}
    </Flex>
  );
}
