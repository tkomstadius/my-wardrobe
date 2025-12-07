import { PlusIcon, MixIcon } from "@radix-ui/react-icons";
import { Button, Heading, Text } from "@radix-ui/themes";
import { useNavigate } from "react-router";
import { useOutfit } from "../contexts/OutfitContext";
import { useWardrobe } from "../contexts/WardrobeContext";
import { formatDate } from "../utils/dateFormatter";
import styles from "./OutfitsPage.module.css";

export function OutfitsPage() {
  const navigate = useNavigate();
  const { outfits, isLoading } = useOutfit();
  const { getItemById } = useWardrobe();

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Text>Loading outfits...</Text>
        </div>
      </div>
    );
  }

  const sortedOutfits = [...outfits].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Heading size="6">My Outfits</Heading>
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
            style={{ marginTop: "1rem" }}
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
                  <Text weight="bold" size="2">
                    {formatDate(outfit.createdAt)}
                  </Text>
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

      <button
        type="button"
        className={styles.fab}
        onClick={() => navigate("/create-outfit")}
        aria-label="Create outfit"
      >
        <PlusIcon className={styles.fabIcon} />
      </button>
    </div>
  );
}
