import { CameraIcon } from "@radix-ui/react-icons";
import {
  Button,
  Callout,
  Dialog,
  Flex,
  Heading,
  Spinner,
  Text,
  Tabs,
} from "@radix-ui/themes";
import { differenceInDays } from "date-fns";
import { useOptimistic, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { CategoryItemsAccordion } from "../components/common/CategoryItemsAccordion";
import { useOutfit } from "../contexts/OutfitContext";
import { useWeather } from "../contexts/WeatherContext";
import { useImageUpload } from "../hooks/useImageUpload";
import {
  hashImageData,
  type MatchFeedback,
  saveFeedback,
  updatePreferencesFromFeedback,
} from "../utils/aiLearning";
import { findMatchingItems, type ItemMatch } from "../utils/aiMatching";
import styles from "./LogWearPage.module.css";
import { incrementWearCount, loadItems } from "../utils/storageCommands";

export async function loader() {
  const items = await loadItems();
  return { items };
}

export function LogWearPage() {
  const navigate = useNavigate();
  const { items } = useLoaderData<typeof loader>();
  const { addOutfit } = useOutfit();
  const { weatherData } = useWeather();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>("");
  const [isAIMode, setIsAIMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMatches, setAIMatches] = useState<ItemMatch[]>([]);
  const [acceptedItems, setAcceptedItems] = useState<Set<string>>(new Set());
  const [rejectedItems, setRejectedItems] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<{
    high: boolean;
    medium: boolean;
    low: boolean;
  }>({
    high: true, // High confidence expanded by default
    medium: false,
    low: false,
  });
  const { imagePreview, handleImageUpload, clearImage, isUploading } =
    useImageUpload();
  const [showSaveOutfitDialog, setShowSaveOutfitDialog] = useState(false);
  const [loggedItemIds, setLoggedItemIds] = useState<string[]>([]);
  const [isSavingOutfit, setIsSavingOutfit] = useState(false);

  // useOptimistic: Track items that are being logged optimistically
  // This lets us show instant UI feedback while the database updates happen
  const [optimisticLoggedItems, addOptimisticLog] = useOptimistic<
    Set<string>,
    string[]
  >(
    new Set(), // Initial state: no items logged yet
    (state, itemIds) => {
      // Updater function: add the items being logged to the set
      const newSet = new Set(state);
      for (const id of itemIds) {
        newSet.add(id);
      }
      return newSet;
    }
  );

  const toggleItemSelection = (itemId: string) => {
    // Don't allow toggling items that have already been logged
    if (optimisticLoggedItems.has(itemId)) return;

    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleAcceptItem = async (itemId: string) => {
    // Add to accepted, remove from rejected, add to selected
    setAcceptedItems((prev) => new Set(prev).add(itemId));
    setRejectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    setSelectedItems((prev) => new Set(prev).add(itemId));

    // Phase 2: Record positive feedback
    const match = aiMatches.find((m) => m.item.id === itemId);
    if (match && imagePreview) {
      try {
        const feedback: MatchFeedback = {
          id: `${Date.now()}-${itemId}`,
          timestamp: new Date(),
          outfitPhotoHash: hashImageData(imagePreview),
          suggestedItemId: itemId,
          baseSimilarity: match.baseSimilarity,
          boostedSimilarity: match.similarity,
          confidence: match.confidence,
          userAction: "accepted",
          metadata: {
            category: match.item.category,
            brand: match.item.brand,
            wearCount: match.item.wearCount,
            itemAge: differenceInDays(new Date(), match.item.createdAt),
            daysSinceWorn:
              match.item.wearHistory && match.item.wearHistory.length > 0
                ? differenceInDays(
                    new Date(),
                    match.item.wearHistory[match.item.wearHistory.length - 1]!
                  )
                : undefined,
          },
        };
        await saveFeedback(feedback);
        console.log("✓ Saved positive feedback for", itemId);
      } catch (error) {
        console.error("Failed to save feedback:", error);
        // Don't block the UI on feedback errors
      }
    }
  };

  const handleRejectItem = async (itemId: string) => {
    // Add to rejected, remove from accepted, remove from selected
    setRejectedItems((prev) => new Set(prev).add(itemId));
    setAcceptedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });

    // Phase 2: Record negative feedback
    const match = aiMatches.find((m) => m.item.id === itemId);
    if (match && imagePreview) {
      try {
        const feedback: MatchFeedback = {
          id: `${Date.now()}-${itemId}`,
          timestamp: new Date(),
          outfitPhotoHash: hashImageData(imagePreview),
          suggestedItemId: itemId,
          baseSimilarity: match.baseSimilarity,
          boostedSimilarity: match.similarity,
          confidence: match.confidence,
          userAction: "rejected",
          metadata: {
            category: match.item.category,
            brand: match.item.brand,
            wearCount: match.item.wearCount,
            itemAge: differenceInDays(new Date(), match.item.createdAt),
            daysSinceWorn:
              match.item.wearHistory && match.item.wearHistory.length > 0
                ? differenceInDays(
                    new Date(),
                    match.item.wearHistory[match.item.wearHistory.length - 1]!
                  )
                : undefined,
          },
        };
        await saveFeedback(feedback);
        console.log("✗ Saved negative feedback for", itemId);
      } catch (error) {
        console.error("Failed to save feedback:", error);
        // Don't block the UI on feedback errors
      }
    }
  };

  const handleAnalyzeOutfit = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    setError("");

    try {
      const matches = await findMatchingItems(imagePreview, items, {
        minThreshold: 0.6, // Higher threshold for better quality
        maxPerConfidence: {
          high: 10, // Show top 10 high confidence
          medium: 5, // Show top 5 medium confidence
          low: 3, // Show top 3 low confidence
        },
      });

      setAIMatches(matches);

      // Reset accepted/rejected state for new analysis
      setAcceptedItems(new Set());
      setRejectedItems(new Set());
      setSelectedItems(new Set());
      // Reset expanded sections (high expanded by default)
      setExpandedSections({ high: true, medium: false, low: false });
    } catch (error) {
      console.error("Failed to analyze outfit:", error);
      setError(
        "Failed to analyze photo. Please try again or use manual selection."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) return;

    const itemsToLog = Array.from(selectedItems);

    // Optimistically mark these items as logged IMMEDIATELY
    // User sees instant feedback - items appear "logged" right away
    addOptimisticLog(itemsToLog);

    // Clear the selection immediately for better UX
    setSelectedItems(new Set());
    setError("");

    try {
      // Actually save to IndexedDB in the background
      // This happens while the user sees the optimistic update
      for (const itemId of itemsToLog) {
        await incrementWearCount(itemId);
      }

      // Auto-update AI learning from all the feedback just collected
      // This runs in background, doesn't block navigation
      updatePreferencesFromFeedback().catch((err) => {
        console.error("Failed to update AI preferences:", err);
        // Don't block user flow on learning errors
      });

      // If there's a photo, offer to save as outfit
      if (imagePreview) {
        setLoggedItemIds(itemsToLog);
        setShowSaveOutfitDialog(true);
      } else {
        // No photo, navigate back to home
        navigate("/");
      }
    } catch (err) {
      console.error("Failed to log wear:", err);

      // If this fails, useOptimistic automatically rolls back!
      // The items will un-grey themselves and return to selectable state
      setError("Failed to log wear. Please try again.");

      // Re-select the items that failed so user can retry
      setSelectedItems(new Set(itemsToLog));
    }
  };

  const handleSaveOutfit = async () => {
    if (loggedItemIds.length === 0 || !imagePreview) return;

    setIsSavingOutfit(true);
    try {
      await addOutfit({
        photo: imagePreview,
        itemIds: loggedItemIds,
        createdAt: new Date(),
        weather: weatherData
          ? {
              actualTemp: weatherData.actualTemp,
              feelsLikeTemp: weatherData.feelsLikeTemp,
              precipitation: weatherData.precipitation,
            }
          : undefined,
      });
      setShowSaveOutfitDialog(false);
      navigate("/outfits");
    } catch (error) {
      console.error("Failed to save outfit:", error);
      setError("Failed to save outfit. Please try again.");
    } finally {
      setIsSavingOutfit(false);
    }
  };

  const handleSkipSaveOutfit = () => {
    setShowSaveOutfitDialog(false);
    navigate("/");
  };

  const isPending = optimisticLoggedItems.size > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Log Today's Outfit</h1>
        <Text size="2" color="gray">
          Select items you wore today
        </Text>
      </div>

      {error && (
        <Callout.Root color="red" size="1" className={styles.callout}>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {isPending && (
        <Callout.Root color="blue" size="1" className={styles.callout}>
          <Callout.Text>
            Logging {optimisticLoggedItems.size}{" "}
            {optimisticLoggedItems.size === 1 ? "item" : "items"}...
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Mode Toggle */}
      <Tabs.Root
        value={isAIMode ? "ai" : "manual"}
        onValueChange={(value) => {
          const newIsAIMode = value === "ai";
          setIsAIMode(newIsAIMode);
          setSelectedItems(new Set());
          setAcceptedItems(new Set());
          setRejectedItems(new Set());
          if (!newIsAIMode) {
            setAIMatches([]);
            clearImage();
          }
        }}
      >
        <Tabs.List className={styles.tabsList}>
          <Tabs.Trigger value="ai">🤖 AI Matching</Tabs.Trigger>
          <Tabs.Trigger value="manual">👆 Manual Selection</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      {/* AI Mode */}
      {isAIMode && (
        <div className={styles.aiMode}>
          <Heading size="4">Upload Outfit Photo</Heading>

          <Callout.Root color="blue" size="1">
            <Callout.Text>
              💡 Tip: Plain backgrounds and good lighting improve accuracy!
            </Callout.Text>
          </Callout.Root>

          {!imagePreview ? (
            <div className={styles.uploadButtons}>
              {isUploading ? (
                <Flex direction="column" align="center" gap="3">
                  <Spinner size="3" />
                  <Text size="2" color="gray">
                    Processing photo...
                  </Text>
                </Flex>
              ) : (
                <Button
                  size="3"
                  onClick={() =>
                    document.getElementById("outfit-upload")?.click()
                  }
                >
                  <CameraIcon /> Upload Photo
                </Button>
              )}
              <input
                id="outfit-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div className={styles.photoPreview}>
              <div className={styles.imageContainer}>
                <img src={imagePreview} alt="Outfit" />
                {isUploading && (
                  <div className={styles.loadingOverlay}>
                    <Spinner size="3" />
                  </div>
                )}
              </div>
              <div className={styles.photoActions}>
                <Button
                  variant="soft"
                  color="red"
                  onClick={() => {
                    clearImage();
                    setAIMatches([]);
                  }}
                >
                  Remove Photo
                </Button>
                <Button
                  size="3"
                  onClick={handleAnalyzeOutfit}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "✨ Find Matching Items"}
                </Button>
              </div>
            </div>
          )}

          {aiMatches.length > 0 && (
            <div className={styles.matchResults}>
              <Heading size="4">AI Suggestions (Review & Confirm)</Heading>

              <div className={styles.matchesByConfidence}>
                {(["high", "medium", "low"] as const).map((confidenceLevel) => {
                  const matchesAtLevel = aiMatches.filter(
                    (m) => m.confidence === confidenceLevel
                  );
                  if (matchesAtLevel.length === 0) return null;

                  const isExpanded = expandedSections[confidenceLevel];

                  return (
                    <div
                      key={confidenceLevel}
                      className={styles.confidenceGroup}
                    >
                      <div className={styles.confidenceHeader}>
                        <Text size="2" weight="bold" color="gray">
                          {confidenceLevel === "high" && "🟢 High Confidence"}
                          {confidenceLevel === "medium" && "🟡 Likely Match"}
                          {confidenceLevel === "low" && "🟠 Possible Match"} (
                          {matchesAtLevel.length})
                        </Text>

                        {!isExpanded && (
                          <Button
                            size="1"
                            variant="ghost"
                            onClick={() =>
                              setExpandedSections((prev) => ({
                                ...prev,
                                [confidenceLevel]: true,
                              }))
                            }
                          >
                            Show {matchesAtLevel.length} matches
                          </Button>
                        )}

                        {isExpanded && confidenceLevel !== "high" && (
                          <Button
                            size="1"
                            variant="ghost"
                            onClick={() =>
                              setExpandedSections((prev) => ({
                                ...prev,
                                [confidenceLevel]: false,
                              }))
                            }
                          >
                            Hide
                          </Button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className={styles.matchList}>
                          {matchesAtLevel.map((match) => {
                            const isAccepted = acceptedItems.has(match.item.id);
                            const isRejected = rejectedItems.has(match.item.id);

                            return (
                              <div
                                key={match.item.id}
                                className={`${styles.matchRow} ${
                                  isRejected ? styles.rejected : ""
                                }`}
                              >
                                <img
                                  src={match.item.imageUrl}
                                  alt={match.item.brand || match.item.category}
                                  className={styles.matchThumbnail}
                                />
                                <div className={styles.matchDetails}>
                                  <Text size="2" weight="bold">
                                    {match.item.brand || match.item.category}
                                  </Text>
                                  <div className={styles.matchMetadata}>
                                    <Text size="1" color="gray">
                                      {match.item.category}
                                      {match.item.brand &&
                                        ` • ${match.item.brand}`}
                                      {` • Worn ${match.item.wearCount}×`}
                                    </Text>
                                  </div>
                                  <Text size="1" weight="bold" color="gray">
                                    Match: {match.percentage}%
                                  </Text>
                                </div>
                                <div className={styles.matchActions}>
                                  <Button
                                    size="2"
                                    variant={isAccepted ? "solid" : "soft"}
                                    color="green"
                                    onClick={() =>
                                      handleAcceptItem(match.item.id)
                                    }
                                    className={styles.acceptButton}
                                  >
                                    ✓
                                  </Button>
                                  <Button
                                    size="2"
                                    variant={isRejected ? "solid" : "soft"}
                                    color="red"
                                    onClick={() =>
                                      handleRejectItem(match.item.id)
                                    }
                                    className={styles.rejectButton}
                                  >
                                    ✗
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Save Outfit Dialog */}
                      <Dialog.Root
                        open={showSaveOutfitDialog}
                        onOpenChange={setShowSaveOutfitDialog}
                      >
                        <Dialog.Content maxWidth="450px">
                          <Dialog.Title>Save Outfit Photo?</Dialog.Title>
                          <Dialog.Description size="2">
                            Would you like to save this outfit photo to your
                            outfits collection?
                          </Dialog.Description>
                          {imagePreview && (
                            <Flex justify="center" my="4">
                              <img
                                src={imagePreview}
                                alt="Outfit preview"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "200px",
                                  borderRadius: "var(--radius-3)",
                                  objectFit: "contain",
                                }}
                              />
                            </Flex>
                          )}
                          <Flex gap="3" mt="4" justify="end">
                            <Dialog.Close>
                              <Button
                                variant="soft"
                                color="gray"
                                onClick={handleSkipSaveOutfit}
                                disabled={isSavingOutfit}
                              >
                                Skip
                              </Button>
                            </Dialog.Close>
                            <Button
                              variant="solid"
                              onClick={handleSaveOutfit}
                              disabled={isSavingOutfit}
                            >
                              {isSavingOutfit ? "Saving..." : "Save Outfit"}
                            </Button>
                          </Flex>
                        </Dialog.Content>
                      </Dialog.Root>
                    </div>
                  );
                })}
              </div>

              <Button
                size="3"
                onClick={handleSubmit}
                disabled={selectedItems.size === 0 || isPending}
                className={styles.submitButton}
              >
                {isPending
                  ? "Logging..."
                  : `Log ${selectedItems.size} ${
                      selectedItems.size === 1 ? "Item" : "Items"
                    }`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {!isAIMode && (
        <div className={styles.manualMode}>
          {items.length === 0 ? (
            <Text size="2" color="gray">
              No items in your wardrobe yet
            </Text>
          ) : (
            <>
              <CategoryItemsAccordion
                items={items}
                selectedItems={selectedItems}
                onToggleSelection={toggleItemSelection}
                disabledItems={optimisticLoggedItems}
              />
              <div className={styles.actionButtons}>
                <Button
                  size="3"
                  variant="soft"
                  color="gray"
                  onClick={() => navigate(-1)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="3"
                  onClick={handleSubmit}
                  disabled={selectedItems.size === 0 || isPending}
                >
                  {isPending
                    ? "Logging..."
                    : `Log ${selectedItems.size} ${
                        selectedItems.size === 1 ? "Item" : "Items"
                      }`}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
