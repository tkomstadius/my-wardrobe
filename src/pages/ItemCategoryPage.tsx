import { useMemo, useState } from 'react';
import { Link, type LoaderFunctionArgs, useLoaderData } from 'react-router';
import { Fab } from '../components/common/Fab';
import { ItemCard } from '../components/common/ItemCard';
import { type BooleanFilter, QuickFilters } from '../components/common/QuickFilters';
import { SearchBar } from '../components/common/SearchBar';
import { Button } from '../components/common/ui/Button';
import { Text } from '../components/common/ui/Text';
import { useItemSearch } from '../hooks/useItemSearch';
import type { ItemCategory } from '../types/wardrobe';
import { CATEGORIES, CATEGORY_IDS, getSubCategoriesForCategory } from '../utils/categories';
import { getItemCountsByCategory, getItemsByCategory } from '../utils/storageCommands';
import styles from './ItemCategoryPage.module.css';

export async function loader({ params }: LoaderFunctionArgs) {
  const { category } = params;

  const isValidItemCategory = category && CATEGORY_IDS.includes(category as ItemCategory);

  if (!isValidItemCategory) {
    return { items: [], category: null, isValid: false, categoryCounts: {} as Partial<Record<ItemCategory, number>> };
  }

  const [categoryItems, categoryCounts] = await Promise.all([
    getItemsByCategory(category as ItemCategory),
    getItemCountsByCategory(),
  ]);

  return {
    items: categoryItems,
    category: category as ItemCategory,
    isValid: true,
    categoryCounts,
  };
}

export function ItemCategoryPage() {
  const { items: categoryItems, category, isValid, categoryCounts } =
    useLoaderData<typeof loader>();

  const [selectedBooleanFilters, setSelectedBooleanFilters] = useState<Set<BooleanFilter>>(
    new Set(),
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  // Apply fast filters first
  const fastFilteredItems = useMemo(() => {
    return categoryItems.filter((item) => {
      // Boolean filters
      if (selectedBooleanFilters.size > 0) {
        const matchesBooleanFilter =
          (selectedBooleanFilters.has('secondhand') && item.isSecondHand) ||
          (selectedBooleanFilters.has('dogCasual') && item.isDogCasual) ||
          (selectedBooleanFilters.has('handmade') && item.isHandmade);

        if (!matchesBooleanFilter) {
          return false;
        }
      }

      // Subcategory filter
      if (selectedSubCategory !== null) {
        if (item.subCategory !== selectedSubCategory) {
          return false;
        }
      }

      return true;
    });
  }, [categoryItems, selectedBooleanFilters, selectedSubCategory]);

  // Then apply search
  const { searchQuery, setSearchQuery, clearSearch, filteredItems } =
    useItemSearch(fastFilteredItems);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [filteredItems]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      secondhand: categoryItems.filter((item) => item.isSecondHand).length,
      dogCasual: categoryItems.filter((item) => item.isDogCasual).length,
      handmade: categoryItems.filter((item) => item.isHandmade).length,
      subCategories: {} as Record<string, number>,
    };

    if (category) {
      const subCategories = getSubCategoriesForCategory(category);
      subCategories.forEach((subCategory) => {
        counts.subCategories[subCategory] = categoryItems.filter(
          (item) => item.subCategory === subCategory,
        ).length;
      });
    }

    return counts;
  }, [categoryItems, category]);

  const handleBooleanFilterToggle = (filter: BooleanFilter) => {
    setSelectedBooleanFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const handleSubCategoryFilterChange = (subCategory: string | null) => {
    setSelectedSubCategory(subCategory);
  };

  const hasItems = categoryItems.length > 0;
  const hasFilteredItems = sortedItems.length > 0;

  if (!isValid) {
    return (
      <div className={styles.errorState}>
        <Text size="2" color="gray">
          Invalid category
        </Text>
      </div>
    );
  }

  return (
    <>
      <div className={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id];
          return (
            <Link
              key={cat.id}
              to={`/items/${cat.id}`}
              className={`${styles.categoryChip} ${category === cat.id ? styles.categoryChipActive : ''}`}
            >
              {cat.title}
              {count !== undefined && <span className={styles.count}>({count})</span>}
            </Link>
          );
        })}
      </div>

      {!hasItems && (
        <div className={styles.emptyState}>
          <Text size="2" color="gray">
            No items in this category yet. Add your first item!
          </Text>
          <Link to="/add-item" className={styles.addItemLink}>
            <Button>Add Item</Button>
          </Link>
        </div>
      )}

      {hasItems && (
        <>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="Search in this category..."
            resultCount={sortedItems.length}
          />

          {category && (
            <QuickFilters
              category={category}
              selectedBooleanFilters={selectedBooleanFilters}
              selectedSubCategory={selectedSubCategory}
              onBooleanFilterToggle={handleBooleanFilterToggle}
              onSubCategoryFilterChange={handleSubCategoryFilterChange}
              itemCounts={filterCounts}
            />
          )}

          {hasFilteredItems ? (
            <div className={styles.grid}>
              {sortedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className={styles.noResultsState}>
              <Text size="2" color="gray">
                {searchQuery ? `No items match "${searchQuery}"` : 'No items found'}
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

      <Fab path="/add-item" />
    </>
  );
}
