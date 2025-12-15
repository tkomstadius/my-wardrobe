import { Text, IconButton, Tabs, Button, Card } from "@radix-ui/themes";
import { GearIcon, BarChartIcon } from "@radix-ui/react-icons";
import { useNavigate, useLoaderData } from "react-router";
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

export async function loader() {
  const items = await loadItems();
  return { items };
}

function CategoryItemGrid({
  items,
  navigate,
}: {
  items: WardrobeItem[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const itemsByCategory = CATEGORIES.map((category) => ({
    category: category.id,
    title: category.title,
    items: items.filter((item) => item.category === category.id),
  })).filter((group) => group.items.length > 0);

  return (
    <div className={styles.categorySections}>
      {itemsByCategory.map(({ category, title, items: categoryItems }) => (
        <div key={category} className={styles.categorySection}>
          <div className={styles.categoryHeader}>
            <Text size="2" weight="medium" className={styles.categoryTitle}>
              {title}
            </Text>
            <Text size="1" color="gray">
              {categoryItems.length}{" "}
              {categoryItems.length === 1 ? "item" : "items"}
            </Text>
          </div>
          <div className={styles.compactGrid}>
            {categoryItems.map((item) => (
              <div key={item.id} className={styles.compactItemWrapper}>
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
  );
}

export function HomePage() {
  const navigate = useNavigate();
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
          {/* Quick Stats */}
          <section className={styles.quickStats}>
            <div className={styles.quickStatsHeader}>
              <Text size="3" weight="medium">
                Quick Stats
              </Text>
              <Button
                variant="ghost"
                size="1"
                onClick={() => navigate("/stats")}
              >
                <BarChartIcon /> View All
              </Button>
            </div>
            <div className={styles.quickStatsGrid}>
              <Card className={styles.quickStatCard}>
                <Text size="1" color="gray">
                  Total Wears
                </Text>
                <Text size="5" weight="bold">
                  {quickStats.totalWears}
                </Text>
              </Card>
              <Card className={styles.quickStatCard}>
                <Text size="1" color="gray">
                  Avg per Item
                </Text>
                <Text size="5" weight="bold">
                  {quickStats.averageWears.toFixed(1)}×
                </Text>
              </Card>
              {quickStats.avgCostPerWear !== null && (
                <Card className={styles.quickStatCard}>
                  <Text size="1" color="gray">
                    Avg Cost/Wear
                  </Text>
                  <Text size="5" weight="bold">
                    {quickStats.avgCostPerWear.toFixed(2)}
                  </Text>
                </Card>
              )}
            </div>
          </section>

          <Tabs.Root defaultValue="today" className={styles.tabs}>
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
                  <Text size="2" color="gray">
                    No items worn today yet.
                    <br />
                    Mark items as worn to track what you're wearing!
                  </Text>
                </div>
              ) : (
                <div className={styles.compactGrid}>
                  {todayItems.map((item) => (
                    <div key={item.id} className={styles.compactItemWrapper}>
                      <ItemCard
                        item={item}
                        onClick={() => navigate(`/item/${item.id}`)}
                        compact
                      />
                    </div>
                  ))}
                </div>
              )}
            </Tabs.Content>

            <Tabs.Content value="week" className={styles.tabContent}>
              {weekItems.length === 0 ? (
                <div className={styles.emptySection}>
                  <Text size="2" color="gray">
                    No items worn in the last 7 days.
                    <br />
                    Mark items as worn to track your wardrobe usage!
                  </Text>
                </div>
              ) : (
                <CategoryItemGrid
                  items={weekItems.map((entry) => entry.item)}
                  navigate={navigate}
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
                  <CategoryItemGrid
                    items={neglectedItems}
                    navigate={navigate}
                  />
                </>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </div>
      )}
    </div>
  );
}
