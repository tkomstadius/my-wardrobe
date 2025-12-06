import { CalendarIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import { ItemCard } from "../components/features/ItemCard";
import { useWardrobe } from "../contexts/WardrobeContext";
import { getDaysAgo } from "../utils/dateFormatter";
import styles from "./HomePage.module.css";

export function HomePage() {
  const navigate = useNavigate();
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

      {!isLoading && hasItems && (
        <Button
          size="3"
          className={styles.logWearButton}
          onClick={() => navigate("/log-wear")}
        >
          <CalendarIcon />
          Log Today's Outfit
        </Button>
      )}

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
                {recentlyWornItems.map(({ item }) => (
                  <div key={item.id} className={styles.itemWrapper}>
                    <ItemCard
                      item={item}
                      onClick={() => navigate(`/item/${item.id}`)}
                    />
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
