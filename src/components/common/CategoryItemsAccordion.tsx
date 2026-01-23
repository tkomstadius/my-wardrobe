import { Text } from "./ui/Text";
import { Flex } from "./ui/Flex";
import { IoChevronDown, IoCheckmark } from "react-icons/io5";
import { useMemo } from "react";
import { WardrobeItem } from "../../types/wardrobe";
import { CATEGORIES } from "../../utils/categories";
import { ItemCard } from "./ItemCard";
import styles from "./CategoryItemsAccordion.module.css";
import { Accordion } from "@base-ui/react";

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
    <Accordion.Root multiple defaultValue={defaultValues}>
      {itemsByCategory.map(({ category, title, items: categoryItems }) => (
        <Accordion.Item value={category} key={category}>
          <Accordion.Trigger className={styles.accordionTrigger}>
            <Text size="2" as="p">
              {title}
            </Text>
            <IoChevronDown className={styles.chevron} />
          </Accordion.Trigger>

          <Accordion.Panel
            className={`${
              isSelectionMode ? styles.selectionMode : styles.accordionContent
            }`}
          >
            {isSelectionMode
              ? categoryItems.map((item) => {
                  const isSelected = selectedItems!.has(item.id);
                  const isDisabled = disabledItems?.has(item.id) ?? false;

                  return (
                    <div
                      key={item.id}
                      className={`${styles.selectableItem} ${
                        isSelected ? styles.selected : ""
                      } ${isDisabled ? styles.disabled : ""}`}
                      onClick={() => onToggleSelection!(item.id)}
                    >
                      {isSelected && (
                        <div className={styles.checkIcon}>
                          <IoCheckmark />
                        </div>
                      )}

                      <img
                        src={item.imageUrl}
                        alt={item.brand}
                        className={styles.itemImage}
                      />
                      <Flex direction="column" gap="1" align="center">
                        <Text size="2" weight="bold">
                          {item.brand || item.subCategory}
                        </Text>
                        <Text size="1">{`Worn ${item.wearCount}×`}</Text>
                      </Flex>
                    </div>
                  );
                })
              : categoryItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
