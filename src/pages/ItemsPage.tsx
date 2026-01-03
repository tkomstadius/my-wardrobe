import { Link, useLoaderData } from "react-router";
import { Grid, Text } from "@radix-ui/themes";
import { loadItems } from "../utils/storageCommands";
import { CATEGORIES } from "../utils/categories";
import { Fab } from "../components/common/Fab";
import styles from "./ItemsPage.module.css";

export async function loader() {
  try {
    const items = await loadItems();
    return { items, error: null };
  } catch (error) {
    console.error("Failed to load items:", error);
    return { items: [], error: error as string };
  }
}

export function ItemsPage() {
  const { items, error } = useLoaderData<typeof loader>();

  const getItemsByCategory = (categoryId: string) =>
    items.filter((item) => item.category === categoryId);

  if (error) {
    return (
      <Text size="2" color="red">
        Could not load items.
      </Text>
    );
  }

  return (
    <>
      <Grid columns="2" gap="3">
        {CATEGORIES.map((category) => {
          const categoryItems = getItemsByCategory(category.id);
          const previewItems = categoryItems
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 4);

          return (
            <Link
              key={category.id}
              to={`/items/${category.id}`}
              className={styles.categoryCard}
            >
              <h2 className={styles.categoryTitle}>{category.title}</h2>

              <div className={styles.categoryPreview}>
                {previewItems.length > 0 ? (
                  <div className={styles.previewGrid}>
                    {previewItems.map((item) => (
                      <div key={item.id} className={styles.previewItem}>
                        <img
                          src={item.imageUrl}
                          alt={category.title}
                          className={styles.previewImage}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyPreview}>
                    <span className={styles.emptyIcon}>📦</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </Grid>

      <Fab path="/add-item" />
    </>
  );
}
