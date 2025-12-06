import { ArrowLeftIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import {
  AlertDialog,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
} from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useWardrobe } from "../contexts/WardrobeContext";
import {
  formatDateDisplay,
  formatItemAge,
  formatLastWorn,
} from "../utils/dateFormatter";
import styles from "./ItemDetailPage.module.css";

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItemById, deleteItem, incrementWearCount } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);

  const item = id ? getItemById(id) : null;

  if (!item) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <Heading size="5">Item not found</Heading>
          <Button onClick={() => navigate("/")} variant="soft">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteItem(id);
      navigate(`/category/${item.category}`);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleMarkAsWorn = async () => {
    if (!id) return;

    try {
      await incrementWearCount(id);
    } catch (error) {
      console.error("Failed to mark as worn:", error);
      alert("Failed to update wear count. Please try again.");
    }
  };

  const costPerWear =
    item.price !== undefined && item.wearCount > 0
      ? item.price / item.wearCount
      : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeftIcon /> Back
        </Button>

        <Flex gap="2">
          <Button
            variant="soft"
            onClick={() => navigate(`/edit-item/${item.id}`)}
          >
            <Pencil1Icon /> Edit
          </Button>

          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button variant="soft" color="red">
                <TrashIcon />
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="450px">
              <AlertDialog.Title>Delete Item</AlertDialog.Title>
              <AlertDialog.Description size="2">
                Are you sure you want to delete this item? This action cannot be
                undone.
              </AlertDialog.Description>
              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button
                    variant="solid"
                    color="red"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </Flex>
      </header>

      <div className={styles.content}>
        {/* Item Image */}
        <div className={styles.imageSection}>
          <img src={item.imageUrl} alt={item.notes || item.brand || "Item"} />
        </div>

        {/* Item Info */}
        <section className={styles.infoSection}>
          <div className={styles.titleArea}>
            {item.notes && (
              <Heading size="6" className={styles.title}>
                {item.notes}
              </Heading>
            )}
            {item.brand && (
              <Text size="4" weight="medium" color="gray">
                {item.brand}
              </Text>
            )}
            <Text size="2" color="gray" className={styles.category}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
          </div>

          {/* Metadata Grid */}
          <div className={styles.metadataGrid}>
            <div className={styles.metadataCard}>
              <Text size="1" color="gray">
                Worn
              </Text>
              <Text size="5" weight="bold">
                {item.wearCount}×
              </Text>
              {item.wearHistory && item.wearHistory.length > 0 && (
                <Text size="1" color="gray">
                  {formatLastWorn(item.wearHistory)}
                </Text>
              )}
            </div>

            {item.price !== undefined && (
              <div className={styles.metadataCard}>
                <Text size="1" color="gray">
                  Price
                </Text>
                <Text size="5" weight="bold" className={styles.price}>
                  {item.price.toFixed(2)} kr
                </Text>
                {costPerWear !== null && (
                  <Text size="1" color="gray">
                    {costPerWear.toFixed(2)} kr/wear
                  </Text>
                )}
              </div>
            )}

            {item.purchaseDate && (
              <div className={styles.metadataCard}>
                <Text size="1" color="gray">
                  Age
                </Text>
                <Text size="5" weight="bold">
                  {formatItemAge(item.purchaseDate)}
                </Text>
                <Text size="1" color="gray">
                  Since {formatDateDisplay(item.purchaseDate)}
                </Text>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className={styles.badges}>
            {item.isSecondHand && (
              <Badge color="amber" size="2">
                Second Hand / Thrifted
              </Badge>
            )}
            {item.isDogCasual && (
              <Badge color="cyan" size="2">
                Dog Casual
              </Badge>
            )}
          </div>

          {/* Mark as Worn Button */}
          <div className={styles.actions}>
            <Button
              size="3"
              onClick={handleMarkAsWorn}
              className={styles.wornButton}
            >
              Mark as Worn Today
            </Button>
          </div>
        </section>

        {/* Future: Statistics Section */}
        {/* <section className={styles.statsSection}>
          <Heading size="4">Statistics</Heading>
          // Wear frequency chart, cost per wear over time, etc.
        </section> */}
      </div>
    </div>
  );
}
