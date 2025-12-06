import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@radix-ui/themes";
import { useState } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleItemSelection = (itemId: string) => {
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

    setIsSubmitting(true);
    try {
      // Increment wear count for all selected items
      await Promise.all(
        Array.from(selectedItems).map((itemId) => incrementWearCount(itemId))
      );

      // Navigate back to home
      navigate("/");
    } catch (error) {
      console.error("Failed to log wear:", error);
      alert("Failed to log wear. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Log Today's Outfit</h1>
        <Text size="2" color="gray">
          Select items you wore today
        </Text>
      </div>

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
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleItemSelection(item.id)}
                          className={`${styles.itemCard} ${
                            isSelected ? styles.selected : ""
                          }`}
                        >
                          <div className={styles.imageWrapper}>
                            <img
                              src={item.imageUrl}
                              alt={item.brand || category.title}
                              className={styles.itemImage}
                            />
                            {isSelected && (
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
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          size="3"
          onClick={handleSubmit}
          disabled={selectedItems.size === 0 || isSubmitting}
        >
          {isSubmitting
            ? "Logging..."
            : `Log ${selectedItems.size} ${
                selectedItems.size === 1 ? "Item" : "Items"
              }`}
        </Button>
      </div>
    </div>
  );
}
