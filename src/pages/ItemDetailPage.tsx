import { ArrowLeftIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { Badge, Button, Heading, Text } from "@radix-ui/themes";
import { set } from "date-fns";
import { useState } from "react";
import {
  Link,
  useNavigate,
  useLoaderData,
  useRevalidator,
  type LoaderFunctionArgs,
} from "react-router";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import { useWardrobe } from "../contexts/WardrobeContext";
import { loadItems } from "../utils/storage";
import { loadOutfits } from "../utils/storage";
import {
  formatDate,
  formatDateDisplay,
  formatItemAge,
  formatLastWorn,
} from "../utils/dateFormatter";
import { getTraitEmoji, getTraitLabel } from "../utils/traits";
import styles from "./ItemDetailPage.module.css";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return { item: null, outfits: [] };
  }

  const [items, allOutfits] = await Promise.all([loadItems(), loadOutfits()]);

  const item = items.find((i) => i.id === id) || null;
  const outfitsWithItem = allOutfits.filter((outfit) =>
    outfit.itemIds.includes(id)
  );

  return { item, outfits: outfitsWithItem };
}

export function ItemDetailPage() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { item, outfits: outfitsWithItem } = useLoaderData<typeof loader>();
  const { deleteItem, incrementWearCount, logWearOnDate, removeWear } =
    useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingWearIndex, setDeletingWearIndex] = useState<number | null>(
    null
  );
  const [showAllWears, setShowAllWears] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

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
    if (!item) return;

    setIsDeleting(true);
    try {
      await deleteItem(item.id);
      navigate(`/items/${item.category}`);
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleMarkAsWorn = async () => {
    if (!item) return;

    try {
      await incrementWearCount(item.id);
      revalidator.revalidate(); // Reload data to show updated wear count
    } catch (error) {
      console.error("Failed to mark as worn:", error);
      alert("Failed to update wear count. Please try again.");
    }
  };

  const handleLogWearOnDate = async () => {
    if (!item || !selectedDate) return;

    try {
      // Set to noon to avoid timezone issues using date-fns
      const date = set(new Date(selectedDate), {
        hours: 12,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      await logWearOnDate(item.id, date);
      setShowDatePicker(false);
      setSelectedDate("");
      revalidator.revalidate(); // Reload data to show updated wear history
    } catch (error) {
      console.error("Failed to log wear:", error);
      alert("Failed to log wear. Please try again.");
    }
  };

  const handleRemoveWear = async (wearIndex: number) => {
    if (!item) return;

    setDeletingWearIndex(wearIndex);
    try {
      await removeWear(item.id, wearIndex);
      revalidator.revalidate(); // Reload data to show updated wear history
    } catch (error) {
      console.error("Failed to remove wear:", error);
      alert("Failed to remove wear. Please try again.");
    } finally {
      setDeletingWearIndex(null);
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
      </header>

      <div className={styles.content}>
        <div className={styles.imageSection}>
          <img src={item.imageUrl} alt={item.notes || item.brand || "Item"} />
        </div>

        <section className={styles.infoSection}>
          <div className={styles.topInfo}>
            {item.brand && (
              <Text size="3" weight="medium" color="gray">
                {item.brand}
              </Text>
            )}
            {item.price !== undefined && (
              <Text size="3" className={styles.priceText}>
                Price: {item.price.toFixed(2)} kr
              </Text>
            )}
            {item.purchaseDate && (
              <Text size="2" color="gray">
                Purchased {formatDateDisplay(item.purchaseDate)} (
                {formatItemAge(item.purchaseDate)})
              </Text>
            )}
            <Text size="2" weight="bold" className={styles.wearCountInline}>
              Worn {item.wearCount}×
            </Text>
            {item.wearHistory && item.wearHistory.length > 0 && (
              <Text size="2" color="gray">
                {formatLastWorn(item.wearHistory)}
              </Text>
            )}
          </div>

          {costPerWear !== null && (
            <div className={styles.costPerWearCard}>
              <Text size="1" color="gray">
                Cost Per Wear
              </Text>
              <Text size="7" weight="bold" className={styles.costPerWear}>
                {costPerWear.toFixed(2)} kr
              </Text>
              <Text size="2" color="gray">
                Based on {item.wearCount} wear{item.wearCount !== 1 ? "s" : ""}
              </Text>
            </div>
          )}

          {/* Category and Notes */}
          <div className={styles.bottomInfo}>
            <Text size="2" color="gray" className={styles.category}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
            {item.subCategory && (
              <Text size="1" color="gray" className={styles.category}>
                {item.subCategory}
              </Text>
            )}
            {item.notes && (
              <Text size="3" color="gray" className={styles.description}>
                {item.notes}
              </Text>
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
            {item.isHandmade && (
              <Badge color="green" size="2">
                Handmade
              </Badge>
            )}
            {item.trait && (
              <Badge color="purple" size="2">
                {getTraitEmoji(item.trait)} {getTraitLabel(item.trait)}
              </Badge>
            )}
          </div>

          {/* AI Embedding Debug Info */}
          {item.embedding && (
            <div className={styles.embeddingDebug}>
              <Text size="1" color="gray">
                AI Embedding (first 3 values):
              </Text>
              <Text size="1" className={styles.embeddingValues}>
                [
                {item.embedding
                  .slice(0, 3)
                  .map((v) => v.toFixed(4))
                  .join(", ")}
                ...]
              </Text>
              <Badge color="green" size="1">
                ✓ AI Ready
              </Badge>
            </div>
          )}

          {/* Mark as Worn Buttons */}
          <div className={styles.actions}>
            {!showDatePicker ? (
              <div className={styles.buttonGroup}>
                <Button
                  size="3"
                  onClick={handleMarkAsWorn}
                  className={styles.wornButton}
                >
                  Mark as Worn Today
                </Button>
                <Button
                  size="3"
                  variant="soft"
                  onClick={() => {
                    // Default to today's date using date-fns formatDate (Swedish ISO 8601)
                    const dateStr = formatDate(new Date());
                    setSelectedDate(dateStr);
                    setShowDatePicker(true);
                  }}
                  className={styles.wornButton}
                >
                  Log Wear on Different Date
                </Button>
              </div>
            ) : (
              <div className={styles.datePickerContainer}>
                <Text size="2" weight="medium">
                  Select the date you wore this item:
                </Text>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={formatDate(new Date())}
                  className={styles.datePicker}
                />
                <div className={styles.datePickerActions}>
                  <Button
                    size="2"
                    variant="soft"
                    color="gray"
                    onClick={() => {
                      setShowDatePicker(false);
                      setSelectedDate("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="2"
                    onClick={handleLogWearOnDate}
                    disabled={!selectedDate}
                  >
                    Log Wear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Wear History */}
        {item.wearHistory && item.wearHistory.length > 0 && (
          <section className={styles.wearHistorySection}>
            <Heading size="4" className={styles.sectionHeading}>
              Wear History ({item.wearHistory.length})
            </Heading>
            <div className={styles.wearHistoryList}>
              {[...item.wearHistory]
                .reverse()
                .slice(0, showAllWears ? item.wearHistory.length : 2)
                .map((date, reverseIndex) => {
                  const actualIndex =
                    item.wearHistory!.length - 1 - reverseIndex;
                  return (
                    <div key={actualIndex} className={styles.wearHistoryItem}>
                      <div className={styles.wearDate}>
                        <Text size="2">{formatDateDisplay(date)}</Text>
                        <Text size="1" color="gray">
                          {formatItemAge(date)}
                        </Text>
                      </div>
                      <Button
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => handleRemoveWear(actualIndex)}
                        disabled={deletingWearIndex === actualIndex}
                      >
                        {deletingWearIndex === actualIndex ? (
                          "Removing..."
                        ) : (
                          <TrashIcon />
                        )}
                      </Button>
                    </div>
                  );
                })}
            </div>
            {item.wearHistory.length > 2 && (
              <div className={styles.showMoreContainer}>
                <Button
                  variant="soft"
                  size="2"
                  onClick={() => setShowAllWears(!showAllWears)}
                >
                  {showAllWears
                    ? "Show Less"
                    : `Show All ${item.wearHistory.length} Wears`}
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Outfit Membership */}
        {outfitsWithItem.length > 0 && (
          <section className={styles.outfitSection}>
            <Heading size="4" className={styles.outfitHeading}>
              Featured in {outfitsWithItem.length}{" "}
              {outfitsWithItem.length === 1 ? "Outfit" : "Outfits"}
            </Heading>
            <div className={styles.outfitGrid}>
              {outfitsWithItem.map((outfit) => (
                <Link
                  key={outfit.id}
                  to={`/outfit/${outfit.id}`}
                  className={styles.outfitCard}
                >
                  {outfit.photo ? (
                    <img
                      src={outfit.photo}
                      alt="Outfit"
                      className={styles.outfitImage}
                    />
                  ) : (
                    <div className={styles.outfitPlaceholder}>
                      <Text size="1" color="gray">
                        No photo
                      </Text>
                    </div>
                  )}
                  <div className={styles.outfitInfo}>
                    <Text size="2" weight="medium">
                      Outfit
                    </Text>
                    {outfit.notes && (
                      <Text
                        size="1"
                        color="gray"
                        className={styles.outfitNotes}
                      >
                        {outfit.notes}
                      </Text>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Edit and Delete Actions */}
        <section className={styles.bottomActions}>
          <DeleteConfirmDialog
            title="Delete Item"
            description="Are you sure you want to delete this item? This action cannot be undone."
            onConfirm={handleDelete}
            isDeleting={isDeleting}
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
            onClick={() => navigate(`/edit-item/${item.id}`)}
            className={styles.editButton}
          >
            <Pencil1Icon /> Edit Item
          </Button>
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
