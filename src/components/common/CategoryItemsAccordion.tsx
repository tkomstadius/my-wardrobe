import { Accordion } from "radix-ui";
import { ChevronDownIcon, Text } from "@radix-ui/themes";
import { WardrobeItem } from "../../types/wardrobe";
import { CATEGORIES } from "../../utils/categories";
import { ItemCard } from "./ItemCard";
import styles from "./CategoryItemsAccordion.module.css";

export function CategoryItemsAccordion({ items }: { items: WardrobeItem[] }) {
  const itemsByCategory = CATEGORIES.map((category) => ({
    category: category.id,
    title: category.title,
    items: items.filter((item) => item.category === category.id),
  })).filter((group) => group.items.length > 0);

  return (
    <Accordion.Root
      type="multiple"
      defaultValue={itemsByCategory.map(({ category }) => category)}
    >
      {itemsByCategory.map(({ category, title, items: categoryItems }) => (
        <Accordion.Item value={category} key={category}>
          <Accordion.Trigger className={styles.accordionTrigger}>
            <Text size="2" as="p">
              {title}
            </Text>
            <ChevronDownIcon className={styles.chevron} />
          </Accordion.Trigger>

          <Accordion.Content className={styles.accordionContent}>
            {categoryItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
