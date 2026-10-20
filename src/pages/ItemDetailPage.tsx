import { useState } from 'react';
import { IoPencilOutline, IoTrashOutline } from 'react-icons/io5';
import {
  type ActionFunctionArgs,
  Link,
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useRevalidator,
  useSearchParams,
} from 'react-router';
import { ArchiveDialog } from '../components/common/ArchiveDialog';
import { BackLink } from '../components/common/BackLink';
import { DeleteConfirmDialog } from '../components/common/DeleteConfirmDialog';
import { RATING_OPTIONS } from '../components/common/form/constants';
import { ProcessingStatusBadge } from '../components/common/ProcessingStatusBadge';
import { Button } from '../components/common/ui/Button';
import { Flex } from '../components/common/ui/Flex';
import { Grid } from '../components/common/ui/Grid';
import { Heading } from '../components/common/ui/Heading';
import { IconButton } from '../components/common/ui/IconButton';
import { Text } from '../components/common/ui/Text';
import { TextField } from '../components/common/ui/TextField';
import { useProcessingStatus } from '../hooks/useProcessingStatus';
import type { ArchiveReason } from '../types/wardrobe';
import {
  isProcessingStale,
  triggerEmbeddingRegeneration,
  triggerItemProcessing,
} from '../utils/aiProcessing';
import {
  formatDate,
  formatDateDisplay,
  formatItemAge,
  formatLastWorn,
  normalizeToNoon,
} from '../utils/dateFormatter';
import {
  archiveItem,
  getItemById,
  getItemStoragePath,
  getOutfitsWithItemId,
  incrementWearCount,
  logWearOnDate,
  removeItem,
  removeWearByDate,
  unarchiveItem,
} from '../utils/storageCommands';
import { showError, showToast } from '../utils/toast';
import { getItemLabel } from '../utils/wardrobeFilters';
import styles from './ItemDetailPage.module.css';

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return { item: null, outfits: [] };
  }

  const [item, outfits] = await Promise.all([getItemById(id), getOutfitsWithItemId(id)]);

  return { item, outfits };
}

export async function clientAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  if (intent === 'delete') {
    return { error: 'Item ID is required' };
  }

  return { success: true };
}

// TODO maybe handle delete differently using a form action instead
// TODO add outfits it is included in

function formatMetadataKey(key: string): string {
  const spaced = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatMetadataValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function ItemDetailPage() {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { item, outfits: outfitsWithItem } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [deletingWearIndex, setDeletingWearIndex] = useState<number | null>(null);
  const [showAllWears, setShowAllWears] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newWearCount, setNewWearCount] = useState<number>();
  // Forced true by the Retry button below, or by arriving here right after creating an item
  // (AddItemPage redirects with ?justAdded=true) or editing its photo (EditItemPage redirects
  // with ?reprocessing=true) — all three cases mean processing was just (re)triggered but the
  // item's loaded status may still show a stale/not-yet-updated value.
  const [forceWatchProcessing, setForceWatchProcessing] = useState(
    () => searchParams.get('justAdded') === 'true' || searchParams.get('reprocessing') === 'true',
  );
  const polledStatus = useProcessingStatus(item?.id ?? '', item?.processingStatus, {
    forceWatch: forceWatchProcessing,
  });
  // A run that died mid-way leaves the item 'pending'/'processing' forever — show it as failed so
  // Retry is offered (the Edge Functions treat such a stale claim as reclaimable).
  const processingStatus =
    item && !forceWatchProcessing && isProcessingStale(item) ? 'failed' : polledStatus;

  const handleRetryProcessing = async () => {
    if (!item) return;
    // item.imageUrl has already been resolved to a signed URL for display — the Edge Function
    // needs the raw storage path instead.
    const storagePath = await getItemStoragePath(item.id);
    if (!storagePath) {
      console.error(`Cannot retry processing for item ${item.id}: no storage path found`);
      return;
    }
    setForceWatchProcessing(true);
    // An existing analysis means what failed was re-embedding a manually edited description —
    // process-item would skip such an item as already processed, so retry that step instead.
    if (item.description && item.metadata) {
      triggerEmbeddingRegeneration(item.id, item.description);
    } else {
      triggerItemProcessing(item.id, storagePath);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    setIsDeleting(true);
    try {
      await removeItem(item.id);
      navigate(`/items/${item.category}`, { replace: true });
    } catch (error) {
      console.error('Failed to delete item:', error);
      showError('Could not delete item. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleArchive = async (reason: ArchiveReason, notes: string) => {
    if (!item) return;

    setIsArchiving(true);
    try {
      await archiveItem(item.id, reason, notes || undefined);
      navigate(`/items/${item.category}`, { replace: true });
      showToast({
        title: `Archived ${getItemLabel(item)}`,
        onUndo: async () => {
          await unarchiveItem(item.id);
          revalidator.revalidate();
        },
      });
    } catch (error) {
      console.error('Failed to archive item:', error);
      showError('Could not archive item. Please try again.');
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!item) return;

    setIsUnarchiving(true);
    try {
      await unarchiveItem(item.id);
      revalidator.revalidate();
    } catch (error) {
      console.error('Failed to unarchive item:', error);
      showError('Could not unarchive item. Please try again.');
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleMarkAsWorn = async () => {
    if (!item) return;

    const wornAt = new Date();
    try {
      const newCount = await incrementWearCount(item.id, wornAt);
      setNewWearCount(newCount);
      revalidator.revalidate();
      showToast({
        title: 'Logged as worn today',
        onUndo: async () => {
          await removeWearByDate(item.id, wornAt);
          setNewWearCount(undefined);
          revalidator.revalidate();
        },
      });
    } catch (error) {
      console.error('Failed to mark as worn:', error);
      showError('Could not log wear. Please try again.');
    }
  };

  const handleLogWearOnDate = async () => {
    if (!item || !selectedDate) return;

    try {
      const date = normalizeToNoon(selectedDate);
      await logWearOnDate(item.id, date);
      setShowDatePicker(false);
      setSelectedDate('');
      revalidator.revalidate(); // Reload data to show updated wear history
      showToast({
        title: `Logged wear on ${formatDateDisplay(date)}`,
        onUndo: async () => {
          await removeWearByDate(item.id, date);
          revalidator.revalidate();
        },
      });
    } catch (error) {
      console.error('Failed to log wear:', error);
      showError('Could not log wear. Please try again.');
    }
  };

  const handleRemoveWear = async (wearIndex: number) => {
    if (!item) return;

    const removedDate = item.wearHistory[wearIndex];
    if (!removedDate) return;
    setDeletingWearIndex(wearIndex);
    try {
      // By date, not index — the index is into this page's possibly-stale copy of the history.
      await removeWearByDate(item.id, removedDate);
      // Drop the optimistic count from "Worn Today" so the reloaded count is shown
      setNewWearCount(undefined);
      revalidator.revalidate(); // Reload data to show updated wear history
      showToast({
        title: `Removed wear from ${formatDateDisplay(removedDate)}`,
        onUndo: async () => {
          await logWearOnDate(item.id, new Date(removedDate));
          revalidator.revalidate();
        },
      });
    } catch (error) {
      console.error('Failed to remove wear:', error);
      showError('Could not remove wear. Please try again.');
    } finally {
      setDeletingWearIndex(null);
    }
  };

  if (!item) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <Heading size="5">Item not found</Heading>
          <BackLink to={'/items'} />
        </div>
      </div>
    );
  }

  const costPerWear =
    item.price !== undefined && item.wearCount > 0 ? item.price / item.wearCount : null;

  const today = new Date();
  const alreadyWornToday = item.wearHistory.some((date) => {
    const d = new Date(date);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  return (
    <div className={styles.container}>
      <Flex gap="2" mb="3">
        <BackLink to={`/items/${item.category}`} />
      </Flex>

      <Flex direction="column" gap="3" className={styles.imageContainer}>
        <div className={styles.imageSection}>
          <img src={item.imageUrl} alt={item.notes || item.brand || 'Item'} />
        </div>

        <ProcessingStatusBadge status={processingStatus} onRetry={handleRetryProcessing} />

        {item.archivedAt && (
          <div className={styles.archiveBanner}>
            <div className={styles.archiveBannerInfo}>
              <Text size="2" weight="bold">
                Archived ·{' '}
                {item.archiveReason === 'thrown_away'
                  ? 'Thrown Away'
                  : item.archiveReason === 'donated'
                    ? 'Donated'
                    : item.archiveReason === 'sold'
                      ? 'Sold'
                      : ''}
              </Text>
              <Text size="1" color="gray">
                {formatDateDisplay(item.archivedAt)}
              </Text>
              {item.archiveNotes && (
                <Text size="2" color="gray" className={styles.archiveNotes}>
                  &ldquo;{item.archiveNotes}&rdquo;
                </Text>
              )}
            </div>
            <Button onClick={handleUnarchive} disabled={isUnarchiving}>
              {isUnarchiving ? 'Restoring...' : 'Unarchive'}
            </Button>
          </div>
        )}

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

            <Flex gap="2" className={styles.attributes}>
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

          {!item.archivedAt && (
            <Flex direction="column" gap="2">
              {!showDatePicker ? (
                <Flex gap="2">
                  <Button
                    onClick={handleMarkAsWorn}
                    className={styles.wornButton}
                    disabled={alreadyWornToday}
                  >
                    {alreadyWornToday ? 'Logged Today ✓' : 'Worn Today'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const dateStr = formatDate(new Date());
                      setSelectedDate(dateStr);
                      setShowDatePicker(true);
                    }}
                    className={styles.wornButton}
                  >
                    Log Past Wear
                  </Button>
                </Flex>
              ) : (
                <div className={styles.datePickerContainer}>
                  <Text size="2" weight="medium">
                    Select the date you wore this item:
                  </Text>
                  <TextField.Root size="3">
                    <TextField.Input
                      type="date"
                      value={selectedDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSelectedDate(e.target.value)
                      }
                      max={formatDate(new Date())}
                    />
                  </TextField.Root>
                  <Flex gap="2" justify="end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDatePicker(false);
                        setSelectedDate('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleLogWearOnDate} disabled={!selectedDate}>
                      Log Wear
                    </Button>
                  </Flex>
                </div>
              )}
            </Flex>
          )}
        </section>

        {/* AI Analysis */}
        {(item.description || (item.metadata && Object.keys(item.metadata).length > 0)) && (
          <section className={styles.aiAnalysisSection}>
            <Heading size="4" className={styles.sectionHeading}>
              AI Analysis
            </Heading>
            {item.description && (
              <Text size="2" color="gray" className={styles.aiDescription}>
                {item.description}
              </Text>
            )}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className={styles.metadataList}>
                {Object.entries(item.metadata).map(([key, value]) => (
                  <div key={key} className={styles.metadataRow}>
                    <Text size="1" color="gray">
                      {formatMetadataKey(key)}
                    </Text>
                    <Text size="1">{formatMetadataValue(value)}</Text>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

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
                  const actualIndex = item.wearHistory!.length - 1 - reverseIndex;
                  return (
                    <div key={actualIndex} className={styles.wearHistoryItem}>
                      <div className={styles.wearDate}>
                        <Text size="2">{formatDateDisplay(date)}</Text>
                        <Text size="1" color="gray">
                          {formatItemAge(date)}
                        </Text>
                      </div>
                      {deletingWearIndex === actualIndex ? (
                        <Text size="1" color="gray">
                          Removing...
                        </Text>
                      ) : (
                        <IconButton
                          onClick={() => handleRemoveWear(actualIndex)}
                          ariaLabel="Remove this wear"
                          className={styles.removeWearButton}
                        >
                          <IoTrashOutline />
                        </IconButton>
                      )}
                    </div>
                  );
                })}
            </div>
            {item.wearHistory.length > 2 && (
              <div className={styles.showMoreContainer}>
                <Button onClick={() => setShowAllWears(!showAllWears)}>
                  {showAllWears ? 'Show Less' : `Show All ${item.wearHistory.length} Wears`}
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Outfit Membership */}
        {outfitsWithItem.length > 0 && (
          <section className={styles.outfitSection}>
            <Heading size="4" className={styles.outfitHeading}>
              Featured in {outfitsWithItem.length}{' '}
              {outfitsWithItem.length === 1 ? 'Outfit' : 'Outfits'}
            </Heading>
            <div className={styles.outfitGrid}>
              {outfitsWithItem.map((outfit) => (
                <Link key={outfit.id} to={`/outfit/${outfit.id}`} className={styles.outfitCard}>
                  {outfit.photo ? (
                    <img src={outfit.photo} alt="Outfit" className={styles.outfitImage} />
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
                      <Text size="1" color="gray" className={styles.outfitNotes}>
                        {outfit.notes}
                      </Text>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Edit, Archive and Delete Actions */}
        <section className={styles.bottomActions}>
          <DeleteConfirmDialog
            title="Delete Item"
            description="Are you sure you want to delete this item? This action cannot be undone."
            onConfirm={handleDelete}
            isDeleting={isDeleting}
            triggerButton={
              <Button variant="destructive" className={styles.deleteButton}>
                <IoTrashOutline /> Delete
              </Button>
            }
          />

          {!item.archivedAt && (
            <ArchiveDialog
              onConfirm={handleArchive}
              isArchiving={isArchiving}
              triggerButton={
                <Button variant="outline" className={styles.archiveButton}>
                  Archive
                </Button>
              }
            />
          )}

          <Button onClick={() => navigate(`/edit-item/${item.id}`)} className={styles.editButton}>
            <IoPencilOutline /> Edit Item
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
