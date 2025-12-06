import { Text } from "@radix-ui/themes";
import { Link } from "react-router";
import { ItemCard } from "../components/features/ItemCard";
import { useWardrobe } from "../contexts/WardrobeContext";
import { getDaysAgo } from "../utils/dateFormatter";
import styles from "./HomePage.module.css";

export function HomePage() {
  const { items, getItemsWornInPeriod, isLoading } = useWardrobe();
  const hasItems = items.length > 0;

  // Get items worn in the last 7 days
  const recentlyWornItems = getItemsWornInPeriod(getDaysAgo(7));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Wardrobe</h2>
        <Text size="2" color="gray">
          {items.length} {items.length === 1 ? "item" : "items"} total
        </Text>
      </div>

      {isLoading && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            Loading your wardrobe...
          </Text>
        </div>
      )}

      {!isLoading && !hasItems && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No items yet. Add your first wardrobe item to get started!
          </Text>
        </div>
      )}

      {!isLoading && hasItems && (
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
              <div className={styles.itemGrid}>
                {recentlyWornItems.map(({ item, wearCount }) => (
                  <Link
                    key={item.id}
                    to={`/category/${item.category}`}
                    className={styles.itemLink}
                  >
                    <ItemCard item={item} />
                    <div className={styles.wearBadge}>
                      Worn {wearCount}x this week
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
