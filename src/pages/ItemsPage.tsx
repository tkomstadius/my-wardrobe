import { Link } from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import { CATEGORIES } from "../utils/categories";
import styles from "./ItemsPage.module.css";

export function ItemsPage() {
  const { getItemsByCategory } = useWardrobe();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Categories</h1>
      <div className={styles.categoriesGrid}>
        {CATEGORIES.map((category) => {
          const categoryItems = getItemsByCategory(category.id);
          const itemCount = categoryItems.length;
          const previewItems = categoryItems.slice(0, 4);

          return (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className={styles.categoryCard}
            >
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
              <div className={styles.categoryInfo}>
                <h2 className={styles.categoryTitle}>{category.title}</h2>
                <p className={styles.itemCount}>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
