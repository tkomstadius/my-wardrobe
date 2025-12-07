import { CheckIcon } from "@radix-ui/react-icons";
import { Select, Button, Text, Badge } from "@radix-ui/themes";
import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import type { WardrobeItem, ItemCategory } from "../../types/wardrobe";
import { CATEGORIES } from "../../utils/categories";
import { FILTER_ALL } from "../../utils/filters";
import styles from "./ItemSelector.module.css";

// Helper function to check if item was worn recently
function getRecentWearBadge(wearHistory?: Date[]): string | null {
  if (!wearHistory || wearHistory.length === 0) return null;

  // Get the most recent wear date
  const lastWornDate = wearHistory[wearHistory.length - 1];
  if (!lastWornDate) return null;

  const now = new Date();
  const lastWorn = new Date(lastWornDate);
  const diffMs = now.getTime() - lastWorn.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Worn today";
  if (diffDays <= 7) return "Worn this week";
  return null;
}

interface ItemSelectorProps {
  items: WardrobeItem[];
  selectedItems: Set<string>;
  onToggleSelection: (itemId: string) => void;
  disabledItems?: Set<string>;
  emptyMessage?: string;
  actionButtons?: ReactNode;
}

export function ItemSelector({
  items,
  selectedItems,
  onToggleSelection,
  disabledItems = new Set(),
  emptyMessage = "No items found",
  actionButtons,
}: ItemSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | "all">(
    FILTER_ALL
  );
  const [brandFilter, setBrandFilter] = useState<string>(FILTER_ALL);
  const [thriftedFilter, setThriftedFilter] = useState(false);
  const [casualFilter, setCasualFilter] = useState(false);
  const [handmadeFilter, setHandmadeFilter] = useState(false);

  // Get all unique brands from items
  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    for (const item of items) {
      if (item.brand?.trim()) {
        brands.add(item.brand.trim());
      }
    }
    return Array.from(brands).sort();
  }, [items]);

  // Filter items based on active filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (categoryFilter !== FILTER_ALL && item.category !== categoryFilter) {
        return false;
      }

      // Brand filter
      if (brandFilter !== FILTER_ALL && item.brand !== brandFilter) {
        return false;
      }

      // Thrifted filter
      if (thriftedFilter && !item.isSecondHand) {
        return false;
      }

      // Casual filter
      if (casualFilter && !item.isDogCasual) {
        return false;
      }

      // Handmade filter
      if (handmadeFilter && !item.isHandmade) {
        return false;
      }

      return true;
    });
  }, [
    items,
    categoryFilter,
    brandFilter,
    thriftedFilter,
    casualFilter,
    handmadeFilter,
  ]);

  const hasActiveFilters =
    categoryFilter !== FILTER_ALL ||
    brandFilter !== FILTER_ALL ||
    thriftedFilter ||
    casualFilter ||
    handmadeFilter;

  const clearFilters = () => {
    setCategoryFilter(FILTER_ALL);
    setBrandFilter(FILTER_ALL);
    setThriftedFilter(false);
    setCasualFilter(false);
    setHandmadeFilter(false);
  };

  return (
    <div className={styles.container}>
      {/* Sticky Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          {/* Category Filter */}
          <Select.Root
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as ItemCategory | "all")
            }
          >
            <Select.Trigger
              placeholder="Category"
              className={styles.filterSelect}
            />
            <Select.Content>
              <Select.Item value={FILTER_ALL}>All Categories</Select.Item>
              {CATEGORIES.map((category) => (
                <Select.Item key={category.id} value={category.id}>
                  {category.title}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          {/* Brand Filter */}
          <Select.Root value={brandFilter} onValueChange={setBrandFilter}>
            <Select.Trigger
              placeholder="Brand"
              className={styles.filterSelect}
            />
            <Select.Content>
              <Select.Item value={FILTER_ALL}>All Brands</Select.Item>
              {allBrands.map((brand) => (
                <Select.Item key={brand} value={brand}>
                  {brand}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        <div className={styles.filterRow}>
          {/* Toggle Filters */}
          <Button
            size="2"
            variant={thriftedFilter ? "solid" : "soft"}
            color="amber"
            onClick={() => setThriftedFilter(!thriftedFilter)}
          >
            Thrifted
          </Button>

          <Button
            size="2"
            variant={casualFilter ? "solid" : "soft"}
            color="cyan"
            onClick={() => setCasualFilter(!casualFilter)}
          >
            Casual
          </Button>

          <Button
            size="2"
            variant={handmadeFilter ? "solid" : "soft"}
            color="green"
            onClick={() => setHandmadeFilter(!handmadeFilter)}
          >
            Handmade
          </Button>

          {hasActiveFilters && (
            <Button
              size="2"
              variant="outline"
              color="gray"
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Results Count */}
        <div className={styles.resultsCount}>
          <Text size="2" color="gray">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"}
            {selectedItems.size > 0 && <> • {selectedItems.size} selected</>}
          </Text>
        </div>

        {/* Action Buttons (optional) */}
        {actionButtons && (
          <div className={styles.actionButtons}>{actionButtons}</div>
        )}
      </div>

      {/* Items Grid */}
      <div className={styles.itemsGrid}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <Text color="gray">{emptyMessage}</Text>
            {hasActiveFilters && (
              <Button variant="soft" size="2" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedItems.has(item.id);
            const isDisabled = disabledItems.has(item.id);
            const recentBadge = getRecentWearBadge(item.wearHistory);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleSelection(item.id)}
                className={`${styles.itemCard} ${
                  isSelected ? styles.selected : ""
                }`}
                disabled={isDisabled}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={item.imageUrl}
                    alt={item.brand || item.notes || "Item"}
                    className={styles.itemImage}
                  />
                  {recentBadge && (
                    <div className={styles.recentBadge}>
                      <Badge size="1" color="orange" variant="solid">
                        {recentBadge}
                      </Badge>
                    </div>
                  )}
                  {(isSelected || isDisabled) && (
                    <div className={styles.checkOverlay}>
                      <div className={styles.checkIcon}>
                        <CheckIcon />
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  {item.brand && (
                    <p className={styles.itemBrand}>{item.brand}</p>
                  )}
                  {item.notes && (
                    <p className={styles.itemNotes}>{item.notes}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
