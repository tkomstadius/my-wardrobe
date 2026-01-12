import { IoTrashOutline, IoPencilOutline } from "react-icons/io5";
import { Button } from "../components/common/ui/Button";
import { Flex } from "../components/common/ui/Flex";
import { Heading } from "../components/common/ui/Heading";
import { Text } from "../components/common/ui/Text";
import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import { formatDate } from "../utils/dateFormatter";
import styles from "./OutfitDetailPage.module.css";
import { BackLink } from "../components/common/BackLink";
import { RATING_OPTIONS } from "../components/common/form/constants";
import {
  getOutfitById,
  loadItems,
  removeOutfit,
} from "../utils/storageCommands";
import { ItemCard } from "../components/common/ItemCard";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) {
    return { outfit: null, outfitItems: [] };
  }

  const [outfit, items] = await Promise.all([getOutfitById(id), loadItems()]);

  if (!outfit) {
    return { outfit: null, outfitItems: [] };
  }

  const outfitItems = items.filter((item) => outfit.itemIds.includes(item.id));

  return { outfit, outfitItems };
}

export function OutfitDetailPage() {
  const { outfit, outfitItems } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeOutfit(outfit.id);
      navigate("/outfits");
    } catch (error) {
      console.error("Failed to delete outfit:", error);
      alert("Failed to delete outfit. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <BackLink to="/outfits" />
      </header>

      <Flex direction="column" gap="3">
        {outfit.photo && (
          <div className={styles.outfitPhoto}>
            <img src={outfit.photo} alt="Outfit" />
          </div>
        )}

        <Flex justify="between" gap="1" align="center">
          <Text size="4" weight="bold" color="blue">
            {
              RATING_OPTIONS.find((rating) => rating.value === outfit.rating)
                ?.emoji
            }
          </Text>
          <Text size="3" weight="bold">
            {formatDate(outfit.createdAt)}
          </Text>
        </Flex>

        {outfit.notes && <Text size="2">{outfit.notes}</Text>}

        <div className={styles.divider} />

        <section className={styles.itemsSection}>
          <Heading size="4">{`${outfitItems.length} items in this outfit`}</Heading>

          {outfitItems.length === 0 ? (
            <div className={styles.emptyState}>
              <Text color="gray">No items found in this outfit</Text>
            </div>
          ) : (
            <>
              {outfitItems.map((item) => (
                <ItemCard item={item} />
              ))}
            </>
          )}
        </section>

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
                <IoTrashOutline /> Delete
              </Button>
            }
          />

          <Button
            size="3"
            variant="soft"
            onClick={() => navigate(`/edit-outfit/${outfit.id}`)}
            className={styles.editButton}
          >
            <IoPencilOutline /> Edit Outfit
          </Button>
        </section>
      </Flex>
    </>
  );
}
