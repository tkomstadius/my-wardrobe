import { Accordion } from "radix-ui";
import { ChevronDownIcon, Text, Checkbox } from "@radix-ui/themes";
import { useMemo } from "react";
import { WardrobeItem } from "../../types/wardrobe";
import { CATEGORIES } from "../../utils/categories";
import { ItemCard } from "./ItemCard";
import styles from "./CategoryItemsAccordion.module.css";

interface CategoryItemsAccordionProps {
  items: WardrobeItem[];
  selectedItems?: Set<string>;
  onToggleSelection?: (itemId: string) => void;
  disabledItems?: Set<string>;
}

export function CategoryItemsAccordion({
  items,
  selectedItems,
  onToggleSelection,
  disabledItems,
}: CategoryItemsAccordionProps) {
  const isSelectionMode =
    selectedItems !== undefined && onToggleSelection !== undefined;

  const itemsByCategory = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category: category.id,
        title: category.title,
        items: items.filter((item) => item.category === category.id),
      })).filter((group) => group.items.length > 0),
    [items]
  );

  const defaultValues = useMemo(
    () => itemsByCategory.map(({ category }) => category),
    [itemsByCategory]
  );

  return (
    <Accordion.Root type="multiple" defaultValue={defaultValues}>
      {itemsByCategory.map(({ category, title, items: categoryItems }) => (
        <Accordion.Item value={category} key={category}>
          <Accordion.Trigger className={styles.accordionTrigger}>
            <Text size="2" as="p">
              {title}
            </Text>
            <ChevronDownIcon className={styles.chevron} />
          </Accordion.Trigger>

          <Accordion.Content className={styles.accordionContent}>
            {isSelectionMode
              ? categoryItems.map((item) => {
                  const isSelected = selectedItems!.has(item.id);
                  const isDisabled = disabledItems?.has(item.id) ?? false;

                  const handleCheckboxChange = () => {
                    if (!isDisabled) {
                      onToggleSelection!(item.id);
                    }
                  };

                  return (
                    <div
                      key={item.id}
                      className={`${styles.selectableItem} ${
                        isSelected ? styles.selected : ""
                      } ${isDisabled ? styles.disabled : ""}`}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={handleCheckboxChange}
                        />
                      </div>
                      <div className={styles.itemPreview}>
                        <img
                          src={item.imageUrl}
                          alt={item.brand || item.category}
                          className={styles.itemImage}
                        />
                        <div className={styles.itemInfo}>
                          <Text size="2" weight="bold">
                            {item.brand || item.category}
                          </Text>
                          <Text size="1" color="gray">
                            {item.category}
                            {item.wearCount > 0 && ` • Worn ${item.wearCount}×`}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                })
              : categoryItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
