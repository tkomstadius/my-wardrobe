import { useMemo, useState } from 'react';
import { IoAddOutline, IoCheckmark } from 'react-icons/io5';
import { useRevalidator } from 'react-router';
import { useItemSearch } from '../../hooks/useItemSearch';
import type { WardrobeItem } from '../../types/wardrobe';
import { CATEGORIES } from '../../utils/categories';
import { THIS_WEEK_DAYS } from '../../utils/config';
import { formatLastWorn, getDaysAgo } from '../../utils/dateFormatter';
import { incrementWearCount, removeWearByDate } from '../../utils/storageCommands';
import { showError, showToast } from '../../utils/toast';
import { getItemLabel, getRecentlyWornItems, isWornToday } from '../../utils/wardrobeFilters';
import { SearchBar } from './SearchBar';
import { Button } from './ui/Button';
import { Dialog } from './ui/Dialog';
import { Text } from './ui/Text';
import styles from './WearAgainSection.module.css';

// Search results are capped so a broad query like "black" doesn't render hundreds of images
const MAX_SEARCH_RESULTS = 30;

interface WearAgainSectionProps {
  items: WardrobeItem[];
}

/**
 * Log today's wears by picking from items worn in the past week (individual pieces get re-worn
 * across days until they're washed), plus a search for anything else.
 */
export function WearAgainSection({ items }: WearAgainSectionProps) {
  const revalidator = useRevalidator();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Items picked via search that weren't worn recently — shown alongside the recent ones
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const groups = useMemo(() => {
    const recentItems = getRecentlyWornItems(items, getDaysAgo(THIS_WEEK_DAYS));
    const recentIds = new Set(recentItems.map((item) => item.id));
    const addedItems = addedIds
      .filter((id) => !recentIds.has(id))
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is WardrobeItem => item !== undefined);
    const shownItems = [...addedItems, ...recentItems];

    return CATEGORIES.map((category) => ({
      id: category.id,
      title: category.title,
      items: shownItems.filter((item) => item.category === category.id),
    })).filter((group) => group.items.length > 0);
  }, [items, addedIds]);

  const toggleItem = (item: WardrobeItem) => {
    if (isWornToday(item)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const toggleFromSearch = (item: WardrobeItem) => {
    if (isWornToday(item)) return;
    const willSelect = !selectedIds.has(item.id);
    setAddedIds((prev) =>
      willSelect ? [...prev, item.id] : prev.filter((addedId) => addedId !== item.id),
    );
    toggleItem(item);
  };

  const handleLog = async () => {
    const itemIds = [...selectedIds];
    if (itemIds.length === 0) return;

    setIsLogging(true);
    const wornAt = new Date();
    try {
      await Promise.all(itemIds.map((id) => incrementWearCount(id, wornAt)));
      const firstItem = items.find((item) => item.id === itemIds[0]);
      showToast({
        title:
          itemIds.length === 1 && firstItem
            ? `Logged ${getItemLabel(firstItem)} as worn`
            : `Logged ${itemIds.length} items as worn`,
        onUndo: async () => {
          await Promise.all(itemIds.map((id) => removeWearByDate(id, wornAt)));
          revalidator.revalidate();
        },
      });
      setSelectedIds(new Set());
      setAddedIds([]);
      revalidator.revalidate();
    } catch (error) {
      console.error('Failed to log wears:', error);
      showError('Could not log wear. Please try again.');
      // Some of the wears may have been saved — reload so the list reflects that
      revalidator.revalidate();
    } finally {
      setIsLogging(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>What are you wearing?</h2>
        <Text size="1" color="gray">
          {groups.length > 0
            ? 'Pick from this week, or find something else'
            : 'Nothing worn this week yet — find what you have on'}
        </Text>
      </div>

      {groups.map((group) => (
        <div key={group.id} className={styles.group}>
          <span className={styles.groupTitle}>{group.title}</span>
          <div className={styles.row}>
            {group.items.map((item) => (
              <WearTile
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggle={toggleItem}
              />
            ))}
          </div>
        </div>
      ))}

      <button type="button" className={styles.addButton} onClick={() => setSearchOpen(true)}>
        <IoAddOutline size={18} />
        Something else…
      </button>

      {/* Sticks above the bottom nav while picking, so it's reachable without scrolling back */}
      <div className={selectedCount > 0 ? styles.logBarSticky : undefined}>
        <Button
          onClick={handleLog}
          disabled={selectedCount === 0 || isLogging}
          className={styles.logButton}
        >
          {isLogging
            ? 'Logging…'
            : selectedCount === 0
              ? 'Select what you’re wearing'
              : `Log ${selectedCount} ${selectedCount === 1 ? 'item' : 'items'} as worn`}
        </Button>
      </div>

      <WearSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={items}
        selectedIds={selectedIds}
        onToggle={toggleFromSearch}
      />
    </section>
  );
}

interface WearTileProps {
  item: WardrobeItem;
  selected: boolean;
  onToggle: (item: WardrobeItem) => void;
}

function WearTile({ item, selected, onToggle }: WearTileProps) {
  const wornToday = isWornToday(item);

  return (
    <button
      type="button"
      className={`${styles.tile} ${selected ? styles.selected : ''} ${wornToday ? styles.done : ''}`}
      onClick={() => onToggle(item)}
      disabled={wornToday}
      aria-pressed={selected}
    >
      <span className={styles.thumb}>
        <img src={item.imageUrl} alt="" className={styles.image} />
        {(selected || wornToday) && (
          <span className={styles.check}>
            <IoCheckmark size={14} />
          </span>
        )}
      </span>
      <span className={styles.label}>{getItemLabel(item)}</span>
      <span className={styles.sublabel}>
        {wornToday ? 'Logged today' : formatLastWorn(item.wearHistory)}
      </span>
    </button>
  );
}

interface WearSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WardrobeItem[];
  selectedIds: Set<string>;
  onToggle: (item: WardrobeItem) => void;
}

function WearSearchDialog({
  open,
  onOpenChange,
  items,
  selectedIds,
  onToggle,
}: WearSearchDialogProps) {
  const { searchQuery, setSearchQuery, clearSearch, filteredItems, hasSearch } =
    useItemSearch(items);
  const results = filteredItems.slice(0, MAX_SEARCH_RESULTS);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content maxWidth="500px">
        <Dialog.Title>Find an item</Dialog.Title>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearSearch}
          placeholder="e.g. jeans, black, Ganni"
          autoFocus
        />

        <div className={styles.results}>
          {!hasSearch ? (
            <Text size="2" color="gray">
              Search by type, color, brand or notes.
            </Text>
          ) : results.length === 0 ? (
            <Text size="2" color="gray">
              No items match “{searchQuery}”.
            </Text>
          ) : (
            <div className={styles.resultsGrid}>
              {results.map((item) => (
                <WearTile
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          )}
        </div>

        <Button onClick={() => onOpenChange(false)} className={styles.doneButton}>
          Done
        </Button>
      </Dialog.Content>
    </Dialog.Root>
  );
}
