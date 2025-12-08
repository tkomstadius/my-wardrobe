import { CheckIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { Text, Badge } from "@radix-ui/themes";
import { useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import type { WardrobeItem } from "../../types/wardrobe";
import { CATEGORIES } from "../../utils/categories";
import { useItemSearch } from "../../hooks/useItemSearch";
import { SearchBar } from "./SearchBar";
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
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Use search hook
  const { searchQuery, setSearchQuery, clearSearch, filteredItems, hasSearch } =
    useItemSearch(items);

  // Track scroll position to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Group filtered items by category
  const itemsByCategory = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category: category.id,
      title: category.title,
      items: filteredItems.filter((item) => item.category === category.id),
    })).filter((group) => group.items.length > 0); // Only show categories with items
  }, [filteredItems]);

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearSearch}
          resultCount={filteredItems.length}
        />

        {/* Selection Count */}
        {selectedItems.size > 0 && (
          <div className={styles.selectionCount}>
            <Text size="2" color="gray">
              {selectedItems.size} selected
            </Text>
          </div>
        )}

        {/* Action Buttons (optional) */}
        {actionButtons && (
          <div className={styles.actionButtons}>{actionButtons}</div>
        )}
      </div>

      {/* Items by Category */}
      <div className={styles.itemsSection}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <Text color="gray">
              {hasSearch ? `No items match "${searchQuery}"` : emptyMessage}
            </Text>
            {hasSearch && (
              <Text size="2" color="gray">
                Try: "tops", "nike", "blue", "thrifted", "casual", etc.
              </Text>
            )}
          </div>
        ) : (
          <div className={styles.categorySections}>
            {itemsByCategory.map(
              ({ category, title, items: categoryItems }) => (
                <div key={category} className={styles.categorySection}>
                  <div className={styles.categoryHeader}>
                    <Text
                      size="2"
                      weight="medium"
                      className={styles.categoryTitle}
                    >
                      {title}
                    </Text>
                    <Text size="1" color="gray">
                      {categoryItems.length}{" "}
                      {categoryItems.length === 1 ? "item" : "items"}
                    </Text>
                  </div>
                  <div className={styles.itemsGrid}>
                    {categoryItems.map((item) => {
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
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className={styles.backToTop}
          aria-label="Back to top"
        >
          <ArrowUpIcon width={20} height={20} />
        </button>
      )}
    </div>
  );
}
