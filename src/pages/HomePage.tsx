import { Text, Tabs, Flex, Box } from "@radix-ui/themes";
import { useLoaderData } from "react-router";
import { useMemo } from "react";
import { ItemCard } from "../components/common/ItemCard";
import { getDaysAgo } from "../utils/dateFormatter";
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
import styles from "./HomePage.module.css";
import { StatsCard } from "../components/common/StatsCard";
import { CategoryItemsAccordion } from "../components/common/CategoryItemsAccordion";

export async function loader() {
  const items = await loadItems();
  const weather = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=59.3294&longitude=18.0687&current=temperature_2m,apparent_temperature,precipitation&forecast_days=1"
  );
  const weatherJson = await weather.json();

  const weatherData = {
    actualTemp: `${weatherJson.current.temperature_2m}°C`,
    feelsLikeTemp: `${weatherJson.current.apparent_temperature}°C`,
    precipitation: `${weatherJson.current.precipitation}mm`,
  };

  return { items, weatherData };
}

export function HomePage() {
  const { items, weatherData } = useLoaderData<typeof loader>();
  const hasItems = items.length > 0;

  const todayItems = useMemo(() => getItemsWornToday(items), [items]);
  const weekItems = useMemo(
    () => getItemsWornInPeriod(items, getDaysAgo(THIS_WEEK_DAYS)),
    [items]
  );
  const neglectedItems = useMemo(
    () => getNeglectedItems(items, NEGLECTED_ITEMS_THRESHOLD_DAYS),
    [items]
  );

  const quickStats = useMemo(() => calculateQuickStats(items), [items]);

  return (
    <Flex direction="column" gap="4">
      {!hasItems ? (
        <Text size="2" className={styles.info}>
          No items yet. Add your first wardrobe item to get started!
        </Text>
      ) : (
        <>
          <Flex justify="between" align="center">
            <Text size="2" className={styles.info}>
              {items.length} {items.length === 1 ? "item" : "items"} total
            </Text>
            <Flex gap="2">
              <Text size="2" className={styles.info}>
                Temp: {weatherData.actualTemp}
              </Text>
              <Text size="2" className={styles.info}>
                Feels: {weatherData.feelsLikeTemp}
              </Text>
              <Text size="2" className={styles.info}>
                Rain: {weatherData.precipitation}
              </Text>
            </Flex>
          </Flex>

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
                  <Flex direction="column" gap="2">
                    {todayItems.map((item) => (
                      <ItemCard item={item} key={item.id} />
                    ))}
                  </Flex>
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
                  <CategoryItemsAccordion
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
                  <CategoryItemsAccordion items={neglectedItems} />
                )}
              </Tabs.Content>
            </Tabs.Root>
          </Flex>
        </>
      )}
    </Flex>
  );
}
