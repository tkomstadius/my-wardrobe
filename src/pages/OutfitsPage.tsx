import { PlusIcon, MixIcon } from "@radix-ui/react-icons";
import { Button, Heading, Text, Select } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useOutfit } from "../contexts/OutfitContext";
import { useWardrobe } from "../contexts/WardrobeContext";
import styles from "./OutfitsPage.module.css";
import { Fab } from "../components/common/Fab";

type SortOption = "date" | "score";

export function OutfitsPage() {
  const navigate = useNavigate();
  const { outfits, isLoading } = useOutfit();
  const { getItemById } = useWardrobe();
  const [sortBy, setSortBy] = useState<SortOption>("date");

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Text>Loading outfits...</Text>
        </div>
      </div>
    );
  }

  const sortedOutfits = [...outfits].sort((a, b) => {
    if (sortBy === "score") {
      // Sort by rating (highest first), then by date if no rating
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      // If ratings are equal (or both 0), sort by date
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      // Sort by date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Heading size="6">My Outfits</Heading>
        {sortedOutfits.length > 0 && (
          <div className={styles.sortControl}>
            <Text size="2" color="gray">
              Sort by:
            </Text>
            <Select.Root
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
              size="2"
            >
              <Select.Trigger className={styles.sortTrigger} />
              <Select.Content>
                <Select.Item value="date">Date (Newest)</Select.Item>
                <Select.Item value="score">Score (Highest)</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        )}
      </header>

      {sortedOutfits.length === 0 ? (
        <div className={styles.emptyState}>
          <MixIcon className={styles.emptyIcon} />
          <Heading size="4">No outfits yet</Heading>
          <Text color="gray">
            Create outfit combinations for inspiration and planning
          </Text>
          <Button
            onClick={() => navigate("/create-outfit")}
            size="3"
            className={styles.emptyButton}
          >
            <PlusIcon /> Create Your First Outfit
          </Button>
        </div>
      ) : (
        <div className={styles.outfitsGrid}>
          {sortedOutfits.map((outfit) => {
            const firstItem = outfit.itemIds[0]
              ? getItemById(outfit.itemIds[0])
              : null;
            const displayImage = outfit.photo || firstItem?.imageUrl;

            return (
              <div
                key={outfit.id}
                className={styles.outfitCard}
                onClick={() => navigate(`/outfit/${outfit.id}`)}
              >
                <div className={styles.outfitImage}>
                  {displayImage ? (
                    <img src={displayImage} alt="Outfit" />
                  ) : (
                    <div className={styles.noImage}>
                      <MixIcon width="32" height="32" />
                    </div>
                  )}
                  <div className={styles.itemCount}>
                    <Text size="1" weight="bold">
                      {outfit.itemIds.length}{" "}
                      {outfit.itemIds.length === 1 ? "item" : "items"}
                    </Text>
                  </div>
                </div>

                <div className={styles.outfitInfo}>
                  {outfit.rating && (
                    <Text size="2" weight="bold" color="blue">
                      ⭐ {outfit.rating}/5
                    </Text>
                  )}
                  {outfit.notes && (
                    <Text size="1" color="gray" className={styles.outfitNotes}>
                      {outfit.notes.length > 40
                        ? `${outfit.notes.substring(0, 40)}...`
                        : outfit.notes}
                    </Text>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Fab path="/create-outfit" />
    </div>
  );
}
