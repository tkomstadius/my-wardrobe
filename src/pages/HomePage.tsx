import { Text, IconButton } from "@radix-ui/themes";
import { GearIcon } from "@radix-ui/react-icons";
import { useNavigate, useLoaderData } from "react-router";
import { ItemCard } from "../components/features/ItemCard";
import { getDaysAgo, countWearsInRange } from "../utils/dateFormatter";
import { CATEGORIES } from "../utils/categories";
import { loadItems } from "../utils/storage";
import type { WardrobeItem } from "../types/wardrobe";
import styles from "./HomePage.module.css";

export async function loader() {
  const items = await loadItems();
  return { items };
}

function getLastWornDate(
  items: WardrobeItem[],
  itemId: string
): Date | undefined {
  const item = items.find((i) => i.id === itemId);
  if (!item || !item.wearHistory || item.wearHistory.length === 0) {
    return undefined;
  }
  return item.wearHistory.at(-1);
}

function getItemsWornInPeriod(
  items: WardrobeItem[],
  startDate: Date,
  endDate: Date = new Date()
): Array<{ item: WardrobeItem; wearCount: number }> {
  return items
    .map((item) => ({
      item,
      wearCount: countWearsInRange(item.wearHistory, startDate, endDate),
    }))
    .filter((entry) => entry.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount);
}

export function HomePage() {
  const navigate = useNavigate();
  const { items } = useLoaderData<typeof loader>();
  const hasItems = items.length > 0;

  // Get items worn in the last 7 days
  const recentlyWornItems = getItemsWornInPeriod(items, getDaysAgo(7));

  // Sort by last worn date (most recent first)
  const itemsSortedByLastWorn = [...recentlyWornItems].sort((a, b) => {
    const dateA = getLastWornDate(items, a.item.id);
    const dateB = getLastWornDate(items, b.item.id);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  });

  // Group by category
  const itemsByCategory = CATEGORIES.map((category) => ({
    category: category.id,
    title: category.title,
    items: itemsSortedByLastWorn.filter(
      ({ item }) => item.category === category.id
    ),
  })).filter((group) => group.items.length > 0); // Only show categories with items

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h2 className={styles.title}>My Wardrobe</h2>
            <Text size="2" color="gray">
              {items.length} {items.length === 1 ? "item" : "items"} total
            </Text>
          </div>
          <IconButton
            variant="ghost"
            size="3"
            onClick={() => navigate("/settings")}
            aria-label="Settings"
          >
            <GearIcon width="20" height="20" />
          </IconButton>
        </div>
      </div>

      {!hasItems && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No items yet. Add your first wardrobe item to get started!
          </Text>
        </div>
      )}

      {hasItems && (
        <div className={styles.content}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Worn This Week</h3>
              <Text size="2" color="gray">
                Last 7 days
              </Text>
            </div>

            {recentlyWornItems.length === 0 ? (
              <div className={styles.emptySection}>
                <Text size="2" color="gray">
                  No items worn in the last 7 days.
                  <br />
                  Mark items as worn to track your wardrobe usage!
                </Text>
              </div>
            ) : (
              <div className={styles.categorySections}>
                {itemsByCategory.map(({ category, title, items }) => (
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
                        {items.length} {items.length === 1 ? "item" : "items"}
                      </Text>
                    </div>
                    <div className={styles.compactGrid}>
                      {items.map(({ item }) => (
                        <div
                          key={item.id}
                          className={styles.compactItemWrapper}
                        >
                          <ItemCard
                            item={item}
                            onClick={() => navigate(`/item/${item.id}`)}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
