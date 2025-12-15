import { Text, Heading, Card } from "@radix-ui/themes";
import { useLoaderData } from "react-router";
import { loadItems } from "../utils/storage";
import { CATEGORIES } from "../utils/categories";
import { getTraitEmoji, getTraitLabel } from "../utils/traits";
import type { WardrobeItem, ItemTrait } from "../types/wardrobe";
import styles from "./StatsPage.module.css";

export async function loader() {
  const items = await loadItems();
  return { items };
}

function calculateStats(items: WardrobeItem[]) {
  const totalItems = items.length;
  const totalWears = items.reduce((sum, item) => sum + item.wearCount, 0);
  const averageWears = totalItems > 0 ? totalWears / totalItems : 0;

  // Category distribution
  const categoryWears = CATEGORIES.map((cat) => {
    const categoryItems = items.filter((item) => item.category === cat.id);
    const wears = categoryItems.reduce((sum, item) => sum + item.wearCount, 0);
    return {
      category: cat.title,
      count: categoryItems.length,
      wears,
    };
  }).sort((a, b) => b.wears - a.wears);

  // Trait distribution
  const traitWears: Record<string, { count: number; wears: number }> = {
    comfort: { count: 0, wears: 0 },
    confidence: { count: 0, wears: 0 },
    creative: { count: 0, wears: 0 },
  };

  items.forEach((item) => {
    if (item.trait) {
      const traitData = traitWears[item.trait];
      if (traitData) {
        traitData.count += 1;
        traitData.wears += item.wearCount;
      }
    }
  });

  // Most worn items
  const mostWorn = [...items]
    .filter((item) => item.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount)
    .slice(0, 10);

  // Least worn items (excluding never worn)
  const leastWorn = [...items]
    .filter((item) => item.wearCount > 0)
    .sort((a, b) => a.wearCount - b.wearCount)
    .slice(0, 10);

  // Never worn items
  const neverWorn = items.filter((item) => item.wearCount === 0);

  // Financial stats
  const itemsWithPrice = items.filter(
    (item) => item.price !== undefined && item.price > 0
  );
  const totalValue = itemsWithPrice.reduce(
    (sum, item) => sum + (item.price || 0),
    0
  );

  const itemsWithCostPerWear = itemsWithPrice.filter(
    (item) => item.wearCount > 0
  );
  const avgCostPerWear =
    itemsWithCostPerWear.length > 0
      ? itemsWithCostPerWear.reduce(
          (sum, item) => sum + (item.price || 0) / item.wearCount,
          0
        ) / itemsWithCostPerWear.length
      : 0;

  const bestValue = [...itemsWithCostPerWear]
    .map((item) => ({
      item,
      costPerWear: (item.price || 0) / item.wearCount,
    }))
    .sort((a, b) => a.costPerWear - b.costPerWear)
    .slice(0, 5);

  const secondHandCount = items.filter((item) => item.isSecondHand).length;
  const secondHandPercentage =
    totalItems > 0 ? (secondHandCount / totalItems) * 100 : 0;

  return {
    totalItems,
    totalWears,
    averageWears,
    categoryWears,
    traitWears,
    mostWorn,
    leastWorn,
    neverWorn,
    totalValue,
    avgCostPerWear,
    bestValue,
    secondHandCount,
    secondHandPercentage,
  };
}

export function StatsPage() {
  const { items } = useLoaderData<typeof loader>();
  const stats = calculateStats(items);

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
                {stats.avgCostPerWear.toFixed(2)} kr
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
