import { PlusIcon } from "@radix-ui/react-icons";
import { Link, useNavigate, useLoaderData } from "react-router";
import { CATEGORIES } from "../utils/categories";
import { loadItems } from "../utils/storage";
import styles from "./ItemsPage.module.css";

export async function loader() {
  const items = await loadItems();
  return { items };
}

export function ItemsPage() {
  const navigate = useNavigate();
  const { items } = useLoaderData<typeof loader>();

  const getItemsByCategory = (categoryId: string) =>
    items.filter((item) => item.category === categoryId);

  return (
    <>
      <div className={styles.container}>
        {CATEGORIES.map((category) => {
          const categoryItems = getItemsByCategory(category.id);
          const previewItems = categoryItems.slice(0, 4);

          return (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
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
      </div>

      <button
        type="button"
        className={styles.fab}
        onClick={() => navigate("/add-item")}
        aria-label="Add item"
      >
        <PlusIcon className={styles.fabIcon} />
      </button>
    </>
  );
}
