import { TrashIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { Button, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useOutfit } from "../contexts/OutfitContext";
import { useWardrobe } from "../contexts/WardrobeContext";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import { formatDate } from "../utils/dateFormatter";
import styles from "./OutfitDetailPage.module.css";
import { BackLink } from "../components/common/BackLink";
import { RATING_OPTIONS } from "../components/common/form/constants";

export function OutfitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOutfitById, deleteOutfit } = useOutfit();
  const { getItemById } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);

  const outfit = id ? getOutfitById(id) : null;

  if (!outfit) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <Heading size="5">Outfit not found</Heading>
          <BackLink to="/outfits" />
        </div>
      </div>
    );
  }

  const outfitItems = outfit.itemIds
    .map((itemId) => getItemById(itemId))
    .filter((item): item is NonNullable<typeof item> => item !== undefined);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteOutfit(outfit.id);
      navigate("/outfits");
    } catch (error) {
      console.error("Failed to delete outfit:", error);
      alert("Failed to delete outfit. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <BackLink to="/outfits" />
      </header>

      <div className={styles.content}>
        {/* Outfit Photo */}
        {outfit.photo && (
          <div className={styles.outfitPhoto}>
            <img src={outfit.photo} alt="Outfit" />
          </div>
        )}

        {/* Outfit Info */}
        <section className={styles.infoSection}>
          <Heading size="6">Outfit</Heading>

          <div className={styles.metadata}>
            <div className={styles.metadataItem}>
              <Text size="2" color="gray">
                Created
              </Text>
              <Text size="3" weight="bold">
                {formatDate(outfit.createdAt)}
              </Text>
            </div>

            <div className={styles.metadataItem}>
              <Text size="2" color="gray">
                Items
              </Text>
              <Text size="3" weight="bold">
                {outfit.itemIds.length}
              </Text>
            </div>
          </div>

          {outfit.notes && (
            <div className={styles.notes}>
              <Text size="2" color="gray">
                Notes
              </Text>
              <Text size="2">{outfit.notes}</Text>
            </div>
          )}

          {/* Ratings */}
          {outfit.rating != undefined && (
            <div className={styles.rating}>
              <Text size="2" color="gray">
                Rating
              </Text>
              <Text size="4" weight="bold" color="blue">
                {
                  RATING_OPTIONS.find(
                    (rating) => rating.value === outfit.rating
                  )?.emoji
                }
              </Text>
            </div>
          )}
        </section>

        {/* Items in Outfit */}
        <section className={styles.itemsSection}>
          <Heading size="4">Items in this Outfit</Heading>

          {outfitItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Text color="gray">No items found in this outfit</Text>
            </div>
          ) : (
            <div className={styles.itemsGrid}>
              {outfitItems.map((item) => (
                <div
                  key={item.id}
                  className={styles.itemCard}
                  onClick={() => navigate(`/item/${item.id}`)}
                >
                  <div className={styles.itemImage}>
                    <img src={item.imageUrl} alt={item.notes || "Item"} />
                  </div>
                  <div className={styles.itemInfo}>
                    <Text size="2" weight="bold">
                      {item.notes || item.brand || "Unnamed"}
                    </Text>
                    {item.brand && item.notes && (
                      <Text size="1" color="gray">
                        {item.brand}
                      </Text>
                    )}
                    <Text size="1" color="gray">
                      {item.category.charAt(0).toUpperCase() +
                        item.category.slice(1)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Edit and Delete Actions */}
        <section className={styles.bottomActions}>
          <DeleteConfirmDialog
            title="Delete Outfit"
            description="Are you sure you want to delete this outfit? This action cannot be undone."
            onConfirm={handleDelete}
            isDeleting={isDeleting}
            confirmText="Delete Outfit"
            triggerButton={
              <Button
                size="3"
                variant="soft"
                color="red"
                className={styles.deleteButton}
              >
                <TrashIcon /> Delete
              </Button>
            }
          />

          <Button
            size="3"
            variant="soft"
            onClick={() => navigate(`/edit-outfit/${outfit.id}`)}
            className={styles.editButton}
          >
            <Pencil1Icon /> Edit Outfit
          </Button>
        </section>
      </div>
    </div>
  );
}
