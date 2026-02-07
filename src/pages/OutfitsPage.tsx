import { useState } from 'react';
import { IoOptionsOutline } from 'react-icons/io5';
import { Link, useLoaderData } from 'react-router';
import { Fab } from '../components/common/Fab';
import { RATING_OPTIONS } from '../components/common/form/constants';
import { Flex } from '../components/common/ui/Flex';
import { Heading } from '../components/common/ui/Heading';
import { Select } from '../components/common/ui/Select';
import { Text } from '../components/common/ui/Text';
import type { Outfit } from '../types/outfit';
import { loadOutfits } from '../utils/storageCommands';
import styles from './OutfitsPage.module.css';

type SortOption = 'date' | 'score';

const getSortedOutfits = (outfits: Outfit[], sortBy: SortOption) => {
  return [...outfits].sort((a, b) => {
    if (sortBy === 'score') {
      // Sort by rating (1 > 0 > -1), then by date if no rating
      const ratingA = a.rating ?? -2; // -2 is lower than -1, so unrated items sort last
      const ratingB = b.rating ?? -2;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      // If ratings are equal, sort by date
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      // Sort by date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
};

export async function loader() {
  const outfits = await loadOutfits();
  return { outfits };
}

export function OutfitsPage() {
  const { outfits } = useLoaderData<typeof loader>();
  const [sortBy, setSortBy] = useState<SortOption>('date');

  const sortedOutfits = getSortedOutfits(outfits, sortBy);

  return (
    <>
      <div className={styles.header}>
        <Heading size="6">My Outfits</Heading>
        {sortedOutfits.length > 0 && (
          <Select.Root value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <Select.Trigger className={styles.sortTrigger} />
            <Select.Content>
              <Select.Item value="date">Date (Newest)</Select.Item>
              <Select.Item value="score">Score (Highest)</Select.Item>
            </Select.Content>
          </Select.Root>
        )}
      </div>

      {sortedOutfits.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="2"
          className={styles.emptyState}
        >
          <IoOptionsOutline className={styles.emptyIcon} />
          <Heading size="4">No outfits yet</Heading>
          <Text color="gray">Create outfit combinations for inspiration and planning</Text>
        </Flex>
      ) : (
        <div className={styles.outfitsGrid}>
          {sortedOutfits.map((outfit) => (
            <Link key={outfit.id} to={`/outfit/${outfit.id}`} className={styles.outfitCard}>
              <div className={styles.outfitImage}>
                {outfit.photo ? (
                  <img src={outfit.photo} alt="Outfit" />
                ) : (
                  <div className={styles.noImage}>
                    <IoOptionsOutline size={32} />
                  </div>
                )}
              </div>

              <Flex direction="column" gap="1">
                <Flex justify="between">
                  {outfit.rating != null && (
                    <Text size="2" weight="bold" color="blue">
                      {RATING_OPTIONS.find((rating) => rating.value === outfit.rating)?.emoji}
                    </Text>
                  )}
                  <Text size="1" weight="bold">
                    {outfit.itemIds.length} {outfit.itemIds.length === 1 ? 'item' : 'items'}
                  </Text>
                </Flex>
                {outfit.notes && (
                  <Text size="1" color="gray" className={styles.outfitNotes}>
                    {outfit.notes.length > 40
                      ? `${outfit.notes.substring(0, 40)}...`
                      : outfit.notes}
                  </Text>
                )}
              </Flex>
            </Link>
          ))}
        </div>
      )}

      <Fab path="/create-outfit" />
    </>
  );
}
