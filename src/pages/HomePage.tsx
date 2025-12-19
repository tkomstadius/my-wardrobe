import { Text, Tabs, Flex, ChevronDownIcon } from "@radix-ui/themes";
import { useLoaderData } from "react-router";
import { useMemo } from "react";
import { ItemCard } from "../components/features/ItemCard";
import { getDaysAgo } from "../utils/dateFormatter";
import { CATEGORIES } from "../utils/categories";
import { loadItems } from "../utils/storage";
import {
  getItemsWornToday,
  getItemsWornInPeriod,
  getNeglectedItems,
} from "../utils/wardrobeFilters";
import { calculateQuickStats } from "../utils/statsCalculations";
import {
  THIS_WEEK_DAYS,
  NEGLECTED_ITEMS_THRESHOLD_DAYS,
} from "../utils/config";
import type { WardrobeItem } from "../types/wardrobe";
import styles from "./HomePage.module.css";
import { StatsCard } from "../components/common/StatsCard";
import { Accordion } from "radix-ui";

export async function loader() {
  const items = await loadItems();
  return { items };
}

function CategoryItemGrid({ items }: { items: WardrobeItem[] }) {
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

          <Accordion.Content
            className={`${styles.compactGrid} ${styles.accordionContent}`}
          >
            {categoryItems.map((item) => (
              <ItemCard key={item.id} item={item} compact />
            ))}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export function HomePage() {
  const { items } = useLoaderData<typeof loader>();
  const hasItems = items.length > 0;

  // Memoize expensive calculations
  const todayItems = useMemo(() => getItemsWornToday(items), [items]);
  const weekItems = useMemo(
    () => getItemsWornInPeriod(items, getDaysAgo(THIS_WEEK_DAYS)),
    [items]
  );
  const neglectedItems = useMemo(
    () => getNeglectedItems(items, NEGLECTED_ITEMS_THRESHOLD_DAYS),
    [items]
  );

  // Quick stats calculations (memoized)
  const quickStats = useMemo(() => calculateQuickStats(items), [items]);

  return (
    <Flex direction="column" gap="4">
      {!hasItems ? (
        <Text size="2" className={styles.info}>
          No items yet. Add your first wardrobe item to get started!
        </Text>
      ) : (
        <>
          <Text size="2" className={styles.info}>
            {items.length} {items.length === 1 ? "item" : "items"} total
          </Text>

          <Flex direction="column" gap="4">
            <section>
              <div className={styles.quickStatsGrid}>
                <StatsCard title="Total Items" value={quickStats.totalWears} />
                <StatsCard
                  title="Avg per Item"
                  value={quickStats.averageWears.toFixed(1)}
                />
                {quickStats.avgCostPerWear !== null && (
                  <StatsCard
                    title="Avg Cost/Wear"
                    value={quickStats.avgCostPerWear.toFixed(2)}
                  />
                )}
              </div>
            </section>

            <Tabs.Root defaultValue="today">
              <Tabs.List className={styles.tabsList}>
                <Tabs.Trigger value="today" className={styles.tabTrigger}>
                  Today
                </Tabs.Trigger>
                <Tabs.Trigger value="week" className={styles.tabTrigger}>
                  This Week
                </Tabs.Trigger>
                <Tabs.Trigger value="neglected" className={styles.tabTrigger}>
                  Neglected
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="today" className={styles.tabContent}>
                {todayItems.length === 0 ? (
                  <div className={styles.emptySection}>
                    <Text size="1" as="p">
                      No items worn today yet.
                    </Text>
                    <Text size="1" as="p">
                      Mark items as worn to track what you're wearing!
                    </Text>
                  </div>
                ) : (
                  <div className={styles.compactGrid}>
                    {todayItems.map((item) => (
                      <ItemCard item={item} compact />
                    ))}
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="week" className={styles.tabContent}>
                {weekItems.length === 0 ? (
                  <div className={styles.emptySection}>
                    <Text size="1" as="p">
                      No items worn in the last 7 days.
                    </Text>
                    <Text size="1" as="p">
                      Mark items as worn to track your wardrobe usage!
                    </Text>
                  </div>
                ) : (
                  <CategoryItemGrid
                    items={weekItems.map((entry) => entry.item)}
                  />
                )}
              </Tabs.Content>

              <Tabs.Content value="neglected" className={styles.tabContent}>
                {neglectedItems.length === 0 ? (
                  <div className={styles.emptySection}>
                    <Text size="2" color="gray">
                      Great job! All your items have been worn recently.
                    </Text>
                  </div>
                ) : (
                  <>
                    <div className={styles.tabDescription}>
                      <Text size="2" color="gray">
                        Items not worn in 30+ days
                      </Text>
                    </div>
                    <CategoryItemGrid items={neglectedItems} />
                  </>
                )}
              </Tabs.Content>
            </Tabs.Root>
          </Flex>
        </>
      )}
    </Flex>
  );
}
