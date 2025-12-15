import { Text, Heading, Card } from "@radix-ui/themes";
import { useMemo } from "react";
import { useLoaderData } from "react-router";
import { loadItems } from "../utils/storage";
import { getTraitEmoji, getTraitLabel } from "../utils/traits";
import { calculateFullStats } from "../utils/statsCalculations";
import type { ItemTrait } from "../types/wardrobe";
import styles from "./StatsPage.module.css";

export async function loader() {
  const items = await loadItems();
  return { items };
}

export function StatsPage() {
  const { items } = useLoaderData<typeof loader>();
  const stats = useMemo(() => calculateFullStats(items), [items]);

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Heading size="6">Statistics</Heading>
        </div>
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No items yet. Add some wardrobe items to see your statistics!
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Heading size="6">Statistics</Heading>
        <Text size="2" color="gray">
          Insights into your wardrobe
        </Text>
      </div>

      <div className={styles.content}>
        {/* Overview Cards */}
        <section className={styles.section}>
          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <Text size="2" color="gray">
                Total Items
              </Text>
              <Text size="8" weight="bold" className={styles.statValue}>
                {stats.totalItems}
              </Text>
            </Card>
            <Card className={styles.statCard}>
              <Text size="2" color="gray">
                Total Wears
              </Text>
              <Text size="8" weight="bold" className={styles.statValue}>
                {stats.totalWears}
              </Text>
            </Card>
            <Card className={styles.statCard}>
              <Text size="2" color="gray">
                Avg Wears/Item
              </Text>
              <Text size="8" weight="bold" className={styles.statValue}>
                {stats.averageWears.toFixed(1)}
              </Text>
            </Card>
            <Card className={styles.statCard}>
              <Text size="2" color="gray">
                Never Worn
              </Text>
              <Text size="8" weight="bold" className={styles.statValue}>
                {stats.neverWorn.length}
              </Text>
            </Card>
          </div>
        </section>

        {/* Personal Style Insights */}
        <section className={styles.section}>
          <Heading size="4" className={styles.sectionTitle}>
            Personal Style Insights
          </Heading>

          <div className={styles.subsection}>
            <Text size="3" weight="medium" className={styles.subsectionTitle}>
              Trait Distribution
            </Text>
            <div className={styles.traitGrid}>
              {(["comfort", "confidence", "creative"] as ItemTrait[]).map(
                (trait) => {
                  const data = stats.traitWears[trait] || {
                    count: 0,
                    wears: 0,
                  };
                  return (
                    <Card key={trait} className={styles.traitCard}>
                      <div className={styles.traitHeader}>
                        <Text size="5">{getTraitEmoji(trait)}</Text>
                        <Text size="2" weight="medium">
                          {getTraitLabel(trait)}
                        </Text>
                      </div>
                      <div className={styles.traitStats}>
                        <div>
                          <Text size="6" weight="bold">
                            {data.count}
                          </Text>
                          <Text size="1" color="gray">
                            items
                          </Text>
                        </div>
                        <div>
                          <Text size="6" weight="bold">
                            {data.wears}
                          </Text>
                          <Text size="1" color="gray">
                            wears
                          </Text>
                        </div>
                      </div>
                    </Card>
                  );
                }
              )}
            </div>
          </div>

          <div className={styles.subsection}>
            <Text size="3" weight="medium" className={styles.subsectionTitle}>
              Category Preferences
            </Text>
            <div className={styles.categoryList}>
              {stats.categoryWears.map((cat) => (
                <div key={cat.category} className={styles.categoryItem}>
                  <div className={styles.categoryInfo}>
                    <Text size="2" weight="medium">
                      {cat.category}
                    </Text>
                    <Text size="1" color="gray">
                      {cat.count} {cat.count === 1 ? "item" : "items"}
                    </Text>
                  </div>
                  <div className={styles.categoryWears}>
                    <Text size="2" weight="bold">
                      {cat.wears}
                    </Text>
                    <Text size="1" color="gray">
                      wears
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wear Patterns */}
        <section className={styles.section}>
          <Heading size="4" className={styles.sectionTitle}>
            Wear Patterns
          </Heading>

          {stats.mostWorn.length > 0 && (
            <div className={styles.subsection}>
              <Text size="3" weight="medium" className={styles.subsectionTitle}>
                Most Worn Items
              </Text>
              <div className={styles.itemList}>
                {stats.mostWorn.map((item, index) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemRank}>
                      <Text size="2" weight="bold" color="gray">
                        #{index + 1}
                      </Text>
                    </div>
                    <div className={styles.itemImage}>
                      <img src={item.imageUrl} alt={item.brand || "Item"} />
                    </div>
                    <div className={styles.itemInfo}>
                      <Text size="2" weight="medium">
                        {item.brand || "Unnamed"}
                      </Text>
                      <Text size="1" color="gray">
                        {item.category.charAt(0).toUpperCase() +
                          item.category.slice(1)}
                      </Text>
                    </div>
                    <div className={styles.itemWears}>
                      <Text size="3" weight="bold">
                        {item.wearCount}×
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.leastWorn.length > 0 && (
            <div className={styles.subsection}>
              <Text size="3" weight="medium" className={styles.subsectionTitle}>
                Least Worn Items
              </Text>
              <div className={styles.itemList}>
                {stats.leastWorn.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemImage}>
                      <img src={item.imageUrl} alt={item.brand || "Item"} />
                    </div>
                    <div className={styles.itemInfo}>
                      <Text size="2" weight="medium">
                        {item.brand || "Unnamed"}
                      </Text>
                      <Text size="1" color="gray">
                        {item.category.charAt(0).toUpperCase() +
                          item.category.slice(1)}
                      </Text>
                    </div>
                    <div className={styles.itemWears}>
                      <Text size="3" weight="bold" color="orange">
                        {item.wearCount}×
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.neverWorn.length > 0 && (
            <div className={styles.subsection}>
              <Text size="3" weight="medium" className={styles.subsectionTitle}>
                Never Worn ({stats.neverWorn.length})
              </Text>
              <Text size="2" color="gray">
                You have {stats.neverWorn.length} items that haven't been worn
                yet.
              </Text>
            </div>
          )}
        </section>

        {/* Financial Insights */}
        <section className={styles.section}>
          <Heading size="4" className={styles.sectionTitle}>
            Financial Insights
          </Heading>

          <div className={styles.statsGrid}>
            <Card className={styles.statCard}>
              <Text size="2" color="gray">
                Total Value
              </Text>
              <Text size="7" weight="bold" className={styles.statValue}>
                {stats.totalValue.toFixed(0)} kr
              </Text>
            </Card>
            <Card className={styles.statCard}>
              <Text size="2" color="gray">
                Avg Cost/Wear
              </Text>
              <Text size="7" weight="bold" className={styles.statValue}>
                {stats.avgCostPerWear !== null
                  ? `${stats.avgCostPerWear.toFixed(2)} kr`
                  : "N/A"}
              </Text>
            </Card>
            <Card className={styles.statCard}>
              <Text size="2" color="gray">
                Second-Hand
              </Text>
              <Text size="7" weight="bold" className={styles.statValue}>
                {stats.secondHandPercentage.toFixed(0)}%
              </Text>
              <Text size="1" color="gray">
                {stats.secondHandCount} items
              </Text>
            </Card>
          </div>

          {stats.bestValue.length > 0 && (
            <div className={styles.subsection}>
              <Text size="3" weight="medium" className={styles.subsectionTitle}>
                Best Value Items
              </Text>
              <div className={styles.itemList}>
                {stats.bestValue.map(({ item, costPerWear }) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemImage}>
                      <img src={item.imageUrl} alt={item.brand || "Item"} />
                    </div>
                    <div className={styles.itemInfo}>
                      <Text size="2" weight="medium">
                        {item.brand || "Unnamed"}
                      </Text>
                      <Text size="1" color="gray">
                        {item.wearCount} wears
                      </Text>
                    </div>
                    <div className={styles.itemWears}>
                      <Text size="3" weight="bold" color="green">
                        {costPerWear.toFixed(2)} kr
                      </Text>
                      <Text size="1" color="gray">
                        per wear
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
