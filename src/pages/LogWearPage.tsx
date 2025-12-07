import { Button, Text, Callout, Heading } from "@radix-ui/themes";
import { CameraIcon } from "@radix-ui/react-icons";
import { useState, useOptimistic, useRef } from "react";
import { useNavigate } from "react-router";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useWardrobe } from "../contexts/WardrobeContext";
import { ItemSelector } from "../components/common/ItemSelector";
import { useImageUpload } from "../hooks/useImageUpload";
import { findMatchingItems, type ItemMatch } from "../utils/aiMatching";
import { getCroppedImage } from "../utils/imageCrop";
import styles from "./LogWearPage.module.css";

export function LogWearPage() {
  const navigate = useNavigate();
  const { items, incrementWearCount } = useWardrobe();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>("");
  const [isAIMode, setIsAIMode] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMatches, setAIMatches] = useState<ItemMatch[]>([]);
  const { imagePreview, handleImageUpload, clearImage } = useImageUpload();

  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

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

  const handleCropConfirm = async () => {
    if (!imagePreview || !completedCrop || !imgRef.current) return;

    try {
      const cropped = await getCroppedImage(
        imagePreview,
        completedCrop,
        imgRef.current
      );
      setCroppedImage(cropped);
      setShowCropper(false);
    } catch (error) {
      console.error("Failed to crop image:", error);
      setError("Failed to crop image. Please try again.");
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCrop({
      unit: "%",
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    });
    setCompletedCrop(null);
  };

  const handleAnalyzeOutfit = async () => {
    // Use cropped image if available, otherwise original
    const imageToAnalyze = croppedImage || imagePreview;
    if (!imageToAnalyze) return;

    setIsAnalyzing(true);
    setError("");

    try {
      const matches = await findMatchingItems(imageToAnalyze, items, {
        minThreshold: 0.55,
      });

      setAIMatches(matches);

      // Auto-select high and medium confidence matches
      const autoSelected = new Set(
        matches
          .filter((m) => m.confidence === "high" || m.confidence === "medium")
          .map((m) => m.item.id)
      );
      setSelectedItems(autoSelected);
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

      // Success! Navigate back to home
      // The optimistic state is no longer needed - items are truly saved
      navigate("/");
    } catch (err) {
      console.error("Failed to log wear:", err);

      // If this fails, useOptimistic automatically rolls back!
      // The items will un-grey themselves and return to selectable state
      setError("Failed to log wear. Please try again.");

      // Re-select the items that failed so user can retry
      setSelectedItems(new Set(itemsToLog));
    }
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
      <div className={styles.modeToggle}>
        <Button
          variant={isAIMode ? "solid" : "outline"}
          onClick={() => {
            setIsAIMode(true);
            setSelectedItems(new Set());
          }}
          size="2"
        >
          🤖 AI Matching
        </Button>
        <Button
          variant={!isAIMode ? "solid" : "outline"}
          onClick={() => {
            setIsAIMode(false);
            setAIMatches([]);
            setSelectedItems(new Set());
            clearImage();
          }}
          size="2"
        >
          👆 Manual Selection
        </Button>
      </div>

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
              <Button
                size="3"
                onClick={() =>
                  document.getElementById("outfit-upload")?.click()
                }
              >
                <CameraIcon /> Upload Photo
              </Button>
              <input
                id="outfit-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </div>
          ) : showCropper ? (
            <div className={styles.cropperContainer}>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className={styles.cropperWrapper}
              >
                <img
                  ref={imgRef}
                  src={imagePreview}
                  alt="Crop preview"
                  style={{ maxWidth: "100%" }}
                />
              </ReactCrop>
              <div className={styles.cropperActions}>
                <Button variant="soft" color="gray" onClick={handleCropCancel}>
                  Cancel
                </Button>
                <Button onClick={handleCropConfirm}>Confirm Crop</Button>
              </div>
            </div>
          ) : (
            <div className={styles.photoPreview}>
              <div className={styles.imageContainer}>
                <img src={croppedImage || imagePreview} alt="Outfit" />
                <button
                  type="button"
                  className={styles.cropButton}
                  onClick={() => {
                    if (croppedImage) {
                      setCroppedImage(null);
                    }
                    setShowCropper(true);
                  }}
                  title={croppedImage ? "Adjust Crop" : "Crop Photo"}
                >
                  ✂️
                </button>
              </div>
              <div className={styles.photoActions}>
                <Button
                  variant="soft"
                  color="red"
                  onClick={() => {
                    clearImage();
                    setCroppedImage(null);
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

                  return (
                    <div
                      key={confidenceLevel}
                      className={styles.confidenceGroup}
                    >
                      <Text size="2" weight="bold" color="gray">
                        {confidenceLevel === "high" && "🟢 High Confidence"}
                        {confidenceLevel === "medium" && "🟡 Likely Match"}
                        {confidenceLevel === "low" && "🟠 Possible Match"}
                      </Text>

                      <div className={styles.matchGrid}>
                        {matchesAtLevel.map((match) => (
                          <button
                            type="button"
                            key={match.item.id}
                            className={`${styles.matchCard} ${
                              selectedItems.has(match.item.id)
                                ? styles.selected
                                : ""
                            }`}
                            onClick={() => {
                              const newSet = new Set(selectedItems);
                              if (newSet.has(match.item.id)) {
                                newSet.delete(match.item.id);
                              } else {
                                newSet.add(match.item.id);
                              }
                              setSelectedItems(newSet);
                            }}
                          >
                            <img
                              src={match.item.imageUrl}
                              alt={match.item.notes}
                            />
                            <div className={styles.matchInfo}>
                              <Text size="1" weight="bold">
                                {match.percentage}%
                              </Text>
                              <Text size="1" color="gray">
                                {match.item.category}
                              </Text>
                            </div>
                          </button>
                        ))}
                      </div>
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
        <div className={styles.selectorContainer}>
          <ItemSelector
            items={items}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            disabledItems={optimisticLoggedItems}
            emptyMessage="No items in your wardrobe yet"
            actionButtons={
              <>
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
              </>
            }
          />
        </div>
      )}
    </div>
  );
}
