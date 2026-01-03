import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { Button, Flex, Grid, Heading, Text, TextField } from "@radix-ui/themes";
import { useState } from "react";
import {
  Link,
  useNavigate,
  useLoaderData,
  useRevalidator,
  type LoaderFunctionArgs,
  ActionFunctionArgs,
} from "react-router";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import {
  getOutfitsWithItemId,
  incrementWearCount,
  logWearOnDate,
  removeItem,
  removeWear,
} from "../utils/storageCommands";
import {
  formatDate,
  formatDateDisplay,
  formatItemAge,
  formatLastWorn,
  normalizeToNoon,
} from "../utils/dateFormatter";
import { RATING_OPTIONS } from "../components/common/form/constants";
import styles from "./ItemDetailPage.module.css";
import { BackLink } from "../components/common/BackLink";
import { loadItemById } from "../utils/indexedDB";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return { item: null, outfits: [] };
  }

  const [item, outfits] = await Promise.all([
    loadItemById(id),
    getOutfitsWithItemId(id),
  ]);

  return { item, outfits };
}

export async function clientAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "delete") {
    return { error: "Item ID is required" };
  }

  return { success: true };
}

export function ItemDetailPage() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { item, outfits: outfitsWithItem } = useLoaderData<typeof loader>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingWearIndex, setDeletingWearIndex] = useState<number | null>(
    null
  );
  const [showAllWears, setShowAllWears] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [newWearCount, setNewWearCount] = useState<number>();

  const handleDelete = async () => {
    if (!item) return;

    setIsDeleting(true);
    try {
      await removeItem(item.id);
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
      const newCount = await incrementWearCount(item.id);
      setNewWearCount(newCount);
    } catch (error) {
      console.error("Failed to mark as worn:", error);
      alert("Failed to update wear count. Please try again.");
    }
  };

  const handleLogWearOnDate = async () => {
    if (!item || !selectedDate) return;

    try {
      const date = normalizeToNoon(selectedDate);
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

  if (!item) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <Heading size="5">Item not found</Heading>
          <BackLink to={"/items"} />
        </div>
      </div>
    );
  }

  const costPerWear =
    item.price !== undefined && item.wearCount > 0
      ? item.price / item.wearCount
      : null;

  return (
    <div className={styles.container}>
      <Flex gap="2" mb="3">
        <BackLink to={`/items/${item.category}`} />
      </Flex>

      <Flex direction="column" gap="3">
        <div className={styles.imageSection}>
          <img src={item.imageUrl} alt={item.notes || item.brand || "Item"} />
        </div>

        <section>
          <Grid columns="2" gap="3">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" className={styles.category}>
                {item.category}
              </Text>
              {item.subCategory && (
                <Text size="1" color="gray" className={styles.category}>
                  {item.subCategory}
                </Text>
              )}
              {item.brand && <Text size="1">{item.brand}</Text>}
              {item.purchaseDate && (
                <Text size="1" color="gray">
                  Purchased {formatDateDisplay(item.purchaseDate)} (
                  {formatItemAge(item.purchaseDate)})
                </Text>
              )}
              {item.price !== undefined && (
                <Text size="1" color="gray">
                  Price: {item.price.toFixed(2)} kr
                </Text>
              )}
            </Flex>

            <Flex direction="column" gap="1">
              <Text size="2">Worn {newWearCount ?? item.wearCount}×</Text>
              {item.wearHistory && item.wearHistory.length > 0 && (
                <Text size="1" color="gray">
                  Last worn: {formatLastWorn(item.wearHistory)}
                </Text>
              )}
              {costPerWear !== null && (
                <Text size="2" weight="bold" className={styles.costPerWear}>
                  {costPerWear?.toFixed(2)} kr/wear
                </Text>
              )}
            </Flex>
          </Grid>
          <div className={styles.divider} />

          <Flex direction="column" gap="1" mb="3">
            {item.notes && (
              <Text size="3" color="gray" className={styles.description}>
                {item.notes}
              </Text>
            )}

            <Flex gap="2">
              {item.isSecondHand && <span>♻️</span>}
              {item.isDogCasual && <span>🐶</span>}
              {item.isHandmade && <span>🧶</span>}
              {item.rating !== undefined && (
                <span className={styles.rating}>
                  {RATING_OPTIONS.find((r) => r.value === item.rating)?.emoji}
                </span>
              )}
            </Flex>
          </Flex>

          <Flex direction="column" gap="2">
            {!showDatePicker ? (
              <Flex gap="2" direction="column">
                <Button
                  size="3"
                  onClick={handleMarkAsWorn}
                  className={styles.wornButton}
                >
                  Mark as Worn Today
                </Button>
                <Button
                  size="3"
                  variant="outline"
                  onClick={() => {
                    const dateStr = formatDate(new Date());
                    setSelectedDate(dateStr);
                    setShowDatePicker(true);
                  }}
                  className={styles.wornButton}
                >
                  Log Wear on Different Date
                </Button>
              </Flex>
            ) : (
              <div className={styles.datePickerContainer}>
                <Text size="2" weight="medium">
                  Select the date you wore this item:
                </Text>
                <TextField.Root
                  variant="soft"
                  type="date"
                  size="3"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={formatDate(new Date())}
                />
                <Flex gap="2" justify="end">
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
                    variant="soft"
                    size="2"
                    onClick={handleLogWearOnDate}
                    disabled={!selectedDate}
                  >
                    Log Wear
                  </Button>
                </Flex>
              </div>
            )}
          </Flex>
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
      </Flex>
    </div>
  );
}
