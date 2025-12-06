import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { Button, Text, Callout } from "@radix-ui/themes";
import { useState, useOptimistic } from "react";
import { useNavigate } from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import type { ItemCategory } from "../types/wardrobe";
import { CATEGORIES } from "../utils/categories";
import styles from "./LogWearPage.module.css";

export function LogWearPage() {
  const navigate = useNavigate();
  const { items, incrementWearCount } = useWardrobe();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [openCategory, setOpenCategory] = useState<ItemCategory | null>(null);
  const [error, setError] = useState<string>("");

  // useOptimistic: Track items that are being logged optimistically
  // This lets us show instant UI feedback while the database updates happen
  const [optimisticLoggedItems, addOptimisticLog] = useOptimistic<
    Set<string>,
    string[]
  >(
    new Set(), // Initial state: no items logged yet
    (state, itemIds) => {
      // Updater function: add the items being logged to the set
      const newSet = new Set(state);
      for (const id of itemIds) {
        newSet.add(id);
      }
      return newSet;
    }
  );

  const toggleItemSelection = (itemId: string) => {
    // Don't allow toggling items that have already been logged
    if (optimisticLoggedItems.has(itemId)) return;

    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleCategory = (categoryId: ItemCategory) => {
    setOpenCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) return;

    const itemsToLog = Array.from(selectedItems);

    // Optimistically mark these items as logged IMMEDIATELY
    // User sees instant feedback - items appear "logged" right away
    addOptimisticLog(itemsToLog);

    // Clear the selection immediately for better UX
    setSelectedItems(new Set());
    setError("");

    try {
      // Actually save to IndexedDB in the background
      // This happens while the user sees the optimistic update
      for (const itemId of itemsToLog) {
        await incrementWearCount(itemId);
      }

      // Success! Navigate back to home
      // The optimistic state is no longer needed - items are truly saved
      navigate("/");
    } catch (err) {
      console.error("Failed to log wear:", err);

      // If this fails, useOptimistic automatically rolls back!
      // The items will un-grey themselves and return to selectable state
      setError("Failed to log wear. Please try again.");

      // Re-select the items that failed so user can retry
      setSelectedItems(new Set(itemsToLog));
    }
  };

  const isPending = optimisticLoggedItems.size > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Log Today's Outfit</h1>
        <Text size="2" color="gray">
          Select items you wore today
        </Text>
      </div>

      {error && (
        <Callout.Root color="red" size="1" style={{ margin: "0 1rem" }}>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {isPending && (
        <Callout.Root color="blue" size="1" style={{ margin: "0 1rem" }}>
          <Callout.Text>
            Logging {optimisticLoggedItems.size}{" "}
            {optimisticLoggedItems.size === 1 ? "item" : "items"}...
          </Callout.Text>
        </Callout.Root>
      )}

      <div className={styles.accordion}>
        {CATEGORIES.map((category) => {
          const categoryItems = items.filter(
            (item) => item.category === category.id
          );
          const selectedInCategory = categoryItems.filter((item) =>
            selectedItems.has(item.id)
          ).length;

          if (categoryItems.length === 0) return null;

          const isOpen = openCategory === category.id;

          return (
            <div key={category.id} className={styles.accordionItem}>
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={styles.accordionTrigger}
              >
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryTitle}>{category.title}</span>
                  <span className={styles.categoryCount}>
                    {selectedInCategory > 0 && (
                      <span className={styles.selectedBadge}>
                        {selectedInCategory} selected
                      </span>
                    )}
                    <span className={styles.totalCount}>
                      {categoryItems.length}{" "}
                      {categoryItems.length === 1 ? "item" : "items"}
                    </span>
                  </span>
                </div>
                <ChevronDownIcon
                  className={`${styles.chevron} ${isOpen ? styles.open : ""}`}
                />
              </button>

              {isOpen && (
                <div className={styles.accordionContent}>
                  <div className={styles.itemGrid}>
                    {categoryItems.map((item) => {
                      const isSelected = selectedItems.has(item.id);
                      const isOptimisticallyLogged = optimisticLoggedItems.has(
                        item.id
                      );

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleItemSelection(item.id)}
                          className={`${styles.itemCard} ${
                            isSelected ? styles.selected : ""
                          }`}
                          disabled={isOptimisticallyLogged}
                          style={{
                            opacity: isOptimisticallyLogged ? 0.5 : 1,
                            cursor: isOptimisticallyLogged
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          <div className={styles.imageWrapper}>
                            <img
                              src={item.imageUrl}
                              alt={item.brand || category.title}
                              className={styles.itemImage}
                            />
                            {(isSelected || isOptimisticallyLogged) && (
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
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <Button
          size="3"
          variant="soft"
          color="gray"
          onClick={() => navigate(-1)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          size="3"
          onClick={handleSubmit}
          disabled={selectedItems.size === 0 || isPending}
        >
          {isPending
            ? "Logging..."
            : `Log ${selectedItems.size} ${
                selectedItems.size === 1 ? "Item" : "Items"
              }`}
        </Button>
      </div>
    </div>
  );
}
