import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { useMemo, useState } from 'react';
import { IoChevronBack, IoChevronForward, IoOptionsOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import type { Outfit } from '../../types/outfit';
import type { WardrobeItem } from '../../types/wardrobe';
import { ItemCard } from './ItemCard';
import { Text } from './ui/Text';
import styles from './WearCalendar.module.css';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WearCalendarProps {
  items: WardrobeItem[];
  outfits: Outfit[];
}

export function WearCalendar({ items, outfits }: WearCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build a map of yyyy-MM-dd → items worn that day (checking ALL wearHistory entries)
  const wearMap = useMemo(() => {
    const map: Record<string, WardrobeItem[]> = {};
    for (const item of items) {
      for (const date of item.wearHistory) {
        const key = format(new Date(date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
    }
    return map;
  }, [items]);

  const outfitMap = useMemo(() => {
    const map: Record<string, Outfit[]> = {};
    for (const outfit of outfits) {
      const key = format(new Date(outfit.createdAt), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(outfit);
    }
    return map;
  }, [outfits]);

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth],
  );
  // Monday-first: (getDay() + 6) % 7 gives Mon=0 … Sun=6
  const leadingBlanks = (getDay(days[0]!) + 6) % 7;

  const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedDateItems = selectedDateKey ? (wearMap[selectedDateKey] ?? []) : [];
  const selectedDateOutfits = selectedDateKey ? (outfitMap[selectedDateKey] ?? []) : [];

  const handleDayClick = (day: Date) => {
    setSelectedDate((prev) => (prev && isSameDay(day, prev) ? null : day));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          aria-label="Previous month"
        >
          <IoChevronBack />
        </button>
        <Text size="2" className={styles.monthLabel}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <IoChevronForward />
        </button>
      </div>

      <div className={styles.grid}>
        {DAY_LABELS.map((label) => (
          <div key={label} className={styles.dayLabel}>
            {label}
          </div>
        ))}
        {Array.from(
          { length: leadingBlanks },
          (_, i) => `blank-${currentMonth.getTime()}-${i}`,
        ).map((blankKey) => (
          <div key={blankKey} />
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const hasWears = Boolean(wearMap[key]?.length);
          const hasOutfits = Boolean(outfitMap[key]?.length);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isTodayDate = isToday(day);
          return (
            <button
              key={key}
              type="button"
              className={[
                styles.day,
                hasWears || hasOutfits ? styles.hasWears : '',
                isSelected ? styles.selected : '',
                isTodayDate ? styles.today : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleDayClick(day)}
              aria-label={format(day, 'MMMM d')}
              aria-pressed={isSelected}
            >
              <span className={styles.dayNumber}>{format(day, 'd')}</span>
              {(hasWears || hasOutfits) && <span className={styles.dot} />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className={styles.selectedDay}>
          <Text size="1" color="gray" className={styles.selectedLabel}>
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          {selectedDateItems.length === 0 && selectedDateOutfits.length === 0 ? (
            <div className={styles.emptyDay}>
              <Text size="1" color="gray">
                Nothing logged this day.
              </Text>
            </div>
          ) : (
            <>
              {selectedDateItems.length > 0 && (
                <div className={styles.itemsGrid}>
                  {selectedDateItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
              {selectedDateOutfits.length > 0 && (
                <div className={styles.section}>
                  <Text size="1" color="gray" className={styles.sectionLabel}>
                    Outfits
                  </Text>
                  <div className={styles.outfitsGrid}>
                    {selectedDateOutfits.map((outfit) => (
                      <Link
                        key={outfit.id}
                        to={`/outfit/${outfit.id}`}
                        className={styles.outfitCard}
                      >
                        <div className={styles.outfitImage}>
                          {outfit.photo ? (
                            <img src={outfit.photo} alt="Outfit" />
                          ) : (
                            <div className={styles.noImage}>
                              <IoOptionsOutline size={24} />
                            </div>
                          )}
                        </div>
                        <Text size="1" color="gray">
                          {outfit.itemIds.length} {outfit.itemIds.length === 1 ? 'item' : 'items'}
                        </Text>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
