import { ArrowLeftIcon, PlusIcon } from "@radix-ui/react-icons";
import { Button, Text } from "@radix-ui/themes";
import {
  Link,
  useNavigate,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { ItemCard } from "../components/features/ItemCard";
import { SearchBar } from "../components/common/SearchBar";
import { useItemSearch } from "../hooks/useItemSearch";
import type { ItemCategory } from "../types/wardrobe";
import { CATEGORY_TITLES, CATEGORY_IDS } from "../utils/categories";
import { loadItems } from "../utils/storage";
import styles from "./ItemCategoryPage.module.css";

export async function loader({ params }: LoaderFunctionArgs) {
  const { category } = params;

  const isValidItemCategory =
    category && CATEGORY_IDS.includes(category as ItemCategory);

  if (!isValidItemCategory) {
    return { items: [], category: null, title: null, isValid: false };
  }

  // TODO: add loading items by category
  const allItems = await loadItems();
  const categoryItems = allItems.filter((item) => item.category === category);

  return {
    items: categoryItems,
    category: category as ItemCategory,
    title: CATEGORY_TITLES[category as ItemCategory],
    isValid: true,
  };
}

export function ItemCategoryPage() {
  const navigate = useNavigate();
  const {
    items: categoryItems,
    title,
    isValid,
  } = useLoaderData<typeof loader>();

  const { searchQuery, setSearchQuery, clearSearch, filteredItems } =
    useItemSearch(categoryItems);

  const hasItems = categoryItems.length > 0;
  const hasFilteredItems = filteredItems.length > 0;

  if (!isValid) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to="/items">
            <Button variant="ghost" size="3">
              <ArrowLeftIcon />
              Back
            </Button>
          </Link>
        </div>
        <div className={styles.errorState}>
          <Text size="2" color="gray">
            Invalid category
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/items">
          <Button variant="ghost" size="3">
            <ArrowLeftIcon />
            Back
          </Button>
        </Link>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.spacer} />
      </div>

      {!hasItems && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No {title?.toLowerCase()} yet. Add your first item!
          </Text>
          <Link to="/add-item" className={styles.addItemLink}>
            <Button size="2">Add Item</Button>
          </Link>
        </div>
      )}

      {hasItems && (
        <>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="Search in this category..."
            resultCount={filteredItems.length}
          />

          {hasFilteredItems ? (
            <div className={styles.grid}>
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className={styles.noResultsState}>
              <Text size="2" color="gray">
                {searchQuery
                  ? `No items match "${searchQuery}"`
                  : "No items found"}
              </Text>
              {searchQuery && (
                <Text size="2" color="gray">
                  Try: brand names, colors, notes, or tags like "thrifted"
                </Text>
              )}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => navigate("/add-item")}
        aria-label="Add item"
      >
        <PlusIcon className={styles.fabIcon} />
      </button>
    </div>
  );
}
