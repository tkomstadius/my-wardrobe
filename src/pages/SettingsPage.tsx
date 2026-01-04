import {
  CheckCircledIcon,
  CrossCircledIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import { Button, Callout, Card, Text } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { getImageEmbedding } from "../utils/aiEmbedding";
import {
  clearAllFeedback,
  getFeedbackStats,
  resetUserPreferences,
  updatePreferencesFromFeedback,
} from "../utils/aiLearning";
import {
  importBackup,
  isShareSupported,
  parseBackupFile,
  shareBackup,
} from "../utils/backup";
import {
  diagnoseAllItems,
  repairWearCountMismatches,
} from "../utils/repairData";
import styles from "./SettingsPage.module.css";
import {
  loadItems,
  loadOutfits,
  updateItemEmbedding,
} from "../utils/storageCommands";
import { useLoaderData } from "react-router-dom";

export async function loader() {
  const items = await loadItems();
  const outfits = await loadOutfits();

  return { items, outfits };
}

export function SettingsPage() {
  const { items, outfits } = useLoaderData<typeof loader>();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Learning state
  const [feedbackStats, setFeedbackStats] = useState<{
    totalFeedback: number;
    acceptedCount: number;
    rejectedCount: number;
    acceptanceRate: number;
  } | null>(null);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [isResettingLearning, setIsResettingLearning] = useState(false);

  // Count items without embeddings
  const itemsNeedingEmbeddings = items.filter((item) => !item.embedding);
  const hasEmbeddingGap = itemsNeedingEmbeddings.length > 0;

  // Load feedback stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getFeedbackStats();
        setFeedbackStats(stats);
      } catch (error) {
        console.error("Failed to load feedback stats:", error);
      }
    }
    loadStats();
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage(null);

      const success = await shareBackup();

      if (success) {
        setMessage({
          type: "success",
          text: isShareSupported()
            ? "Backup file ready! Save it to iCloud Drive to keep it safe."
            : "Backup file downloaded successfully!",
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
      setMessage({
        type: "error",
        text: "Failed to create backup. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleRepairData = async () => {
    try {
      setIsRepairing(true);
      setMessage(null);

      const result = await repairWearCountMismatches();

      if (result.itemsRepaired > 0) {
        setMessage({
          type: "success",
          text: `Repaired ${result.itemsRepaired} item(s) with data inconsistencies! Please refresh the page to see the changes.`,
        });

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({
          type: "info",
          text: `All ${result.itemsChecked} items are healthy - no repairs needed!`,
        });
      }
    } catch (error) {
      console.error("Repair failed:", error);
      setMessage({
        type: "error",
        text: "Failed to repair data. Please try again.",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage(null);

      // Parse and validate the backup file
      const backupData = await parseBackupFile(file);

      // Import the data
      const result = await importBackup(backupData);

      // Show success/warning based on import results
      if (result.errors.length > 0) {
        setMessage({
          type:
            result.itemsImported > 0 || result.outfitsImported > 0
              ? "info"
              : "error",
          text: `Imported ${result.itemsImported} items and ${
            result.outfitsImported
          } outfits, but ${
            result.errors.length
          } item(s) failed. Check console for details.${
            result.itemsImported > 0 || result.outfitsImported > 0
              ? " Refresh the page to see your data."
              : ""
          }`,
        });
        console.error("Import errors:", result.errors);

        // Still reload if we got some data
        if (result.itemsImported > 0 || result.outfitsImported > 0) {
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      } else {
        setMessage({
          type: "success",
          text: `Successfully imported ${result.itemsImported} items and ${result.outfitsImported} outfits! Refresh the page to see your data.`,
        });

        // Reload the page after a short delay to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Import failed:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to import backup. Please check the file and try again.",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      setIsUpdatingPreferences(true);
      setMessage(null);

      const updatedPreferences = await updatePreferencesFromFeedback();

      setMessage({
        type: "success",
        text: `AI learning updated! Processed ${updatedPreferences.totalFeedbackCount} feedback examples.`,
      });

      // Reload stats
      const stats = await getFeedbackStats();
      setFeedbackStats(stats);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setMessage({
        type: "error",
        text: "Failed to update AI learning. Please try again.",
      });
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  const handleResetLearning = async () => {
    if (
      !confirm(
        "Are you sure you want to reset AI learning? This will clear all feedback and preferences."
      )
    ) {
      return;
    }

    try {
      setIsResettingLearning(true);
      setMessage(null);

      await clearAllFeedback();
      await resetUserPreferences();

      setMessage({
        type: "info",
        text: "AI learning has been reset to defaults.",
      });

      // Reload stats
      const stats = await getFeedbackStats();
      setFeedbackStats(stats);
    } catch (error) {
      console.error("Failed to reset learning:", error);
      setMessage({
        type: "error",
        text: "Failed to reset AI learning. Please try again.",
      });
    } finally {
      setIsResettingLearning(false);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    setMessage(null);
    const total = itemsNeedingEmbeddings.length;
    setEmbeddingProgress({ current: 0, total });

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < itemsNeedingEmbeddings.length; i++) {
        const item = itemsNeedingEmbeddings[i];
        if (!item) continue;

        try {
          const embedding = await getImageEmbedding(item.imageUrl);
          await updateItemEmbedding(item.id, embedding);
          successCount++;
          setEmbeddingProgress({ current: i + 1, total });
        } catch (error) {
          console.error(
            `Failed to generate embedding for item ${item.id}:`,
            error
          );
          errorCount++;
          // Continue with next item
        }
      }

      if (errorCount === 0) {
        setMessage({
          type: "success",
          text: `✅ Successfully generated embeddings for all ${successCount} items!`,
        });
      } else {
        setMessage({
          type: "info",
          text: `Generated embeddings for ${successCount} items. ${errorCount} items failed (check console for details).`,
        });
      }
    } catch (error) {
      console.error("Embedding generation failed:", error);
      setMessage({
        type: "error",
        text: "Failed to generate embeddings. Check console for details.",
      });
    } finally {
      setIsGeneratingEmbeddings(false);
      setEmbeddingProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
      </div>

      <div className={styles.content}>
        {/* Backup & Restore Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Backup & Restore</h3>

          <Card className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <Text size="1" color="gray">
                    Items
                  </Text>
                  <Text size="5" weight="bold">
                    {items.length}
                  </Text>
                </div>
                <div className={styles.stat}>
                  <Text size="1" color="gray">
                    Outfits
                  </Text>
                  <Text size="5" weight="bold">
                    {outfits.length}
                  </Text>
                </div>
              </div>

              <div className={styles.infoBox}>
                <Callout.Root size="1">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    {isShareSupported()
                      ? "Export your data and save it to iCloud Drive for safekeeping. You can restore it anytime or use it on another device."
                      : "Export your data to keep a backup. You can restore it anytime or use it on another device."}
                  </Callout.Text>
                </Callout.Root>
              </div>

              <div className={styles.buttonGroup}>
                <Button
                  size="3"
                  onClick={handleExport}
                  disabled={isExporting || items.length === 0}
                  className={styles.primaryButton}
                >
                  {isExporting ? "Creating Backup..." : "Export Backup"}
                </Button>

                <Button
                  size="3"
                  variant="outline"
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className={styles.secondaryButton}
                >
                  {isImporting ? "Importing..." : "Import Backup"}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleFileSelect}
                  className={styles.hiddenInput}
                />
              </div>

              {message && (
                <div className={styles.message}>
                  <Callout.Root
                    color={
                      message.type === "success"
                        ? "green"
                        : message.type === "error"
                        ? "red"
                        : "blue"
                    }
                  >
                    <Callout.Icon>
                      {message.type === "success" ? (
                        <CheckCircledIcon />
                      ) : message.type === "error" ? (
                        <CrossCircledIcon />
                      ) : (
                        <InfoCircledIcon />
                      )}
                    </Callout.Icon>
                    <Callout.Text>{message.text}</Callout.Text>
                  </Callout.Root>
                </div>
              )}
            </div>
          </Card>

          <div className={styles.helpText}>
            <Text size="2" color="gray">
              <strong>How it works:</strong>
            </Text>
            <ul className={styles.helpList}>
              <li>
                <Text size="2" color="gray">
                  <strong>Export:</strong> Creates a backup file with all your
                  items and outfits
                </Text>
              </li>
              <li>
                <Text size="2" color="gray">
                  <strong>Import:</strong> Restores data from a backup file
                  (replaces current data)
                </Text>
              </li>
              <li>
                <Text size="2" color="gray">
                  <strong>Tip:</strong> Export regularly and save to iCloud
                  Drive for peace of mind
                </Text>
              </li>
            </ul>
          </div>
        </section>

        {/* AI Wear Logging Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>AI Wear Logging</h3>

          <Card className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.infoBox}>
                <Callout.Root size="1" color="blue">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    Enable AI-powered wear logging by generating embeddings for
                    your wardrobe items. This is a one-time setup that allows
                    the app to automatically recognize items in outfit photos.
                  </Callout.Text>
                </Callout.Root>
              </div>

              {hasEmbeddingGap && (
                <div className={styles.infoBox}>
                  <Callout.Root color="amber">
                    <Callout.Text>
                      {itemsNeedingEmbeddings.length}{" "}
                      {itemsNeedingEmbeddings.length === 1 ? "item" : "items"}{" "}
                      need embeddings for AI wear logging. Click below to
                      generate them.
                    </Callout.Text>
                  </Callout.Root>
                </div>
              )}

              {!hasEmbeddingGap && items.length > 0 && (
                <div className={styles.infoBox}>
                  <Callout.Root color="green">
                    <Callout.Text>
                      ✅ All {items.length}{" "}
                      {items.length === 1 ? "item has" : "items have"}{" "}
                      embeddings. AI wear logging ready!
                    </Callout.Text>
                  </Callout.Root>
                </div>
              )}

              <div className={styles.buttonGroup}>
                <Button
                  size="3"
                  onClick={handleGenerateEmbeddings}
                  disabled={isGeneratingEmbeddings || !hasEmbeddingGap}
                  className={styles.primaryButton}
                >
                  {isGeneratingEmbeddings
                    ? `Generating... ${embeddingProgress.current}/${embeddingProgress.total}`
                    : `Generate Embeddings (${itemsNeedingEmbeddings.length} items)`}
                </Button>
              </div>

              {isGeneratingEmbeddings && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${
                          (embeddingProgress.current /
                            embeddingProgress.total) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <Text size="1" color="gray" className={styles.progressText}>
                    Processing item {embeddingProgress.current} of{" "}
                    {embeddingProgress.total}...
                  </Text>
                </div>
              )}

              <div className={styles.helpText}>
                <Text size="2" color="gray">
                  <strong>What are embeddings?</strong> AI "fingerprints" of
                  your items that enable photo-based wear logging.
                </Text>
                <Text size="2" color="gray">
                  <strong>When to regenerate:</strong> If you've imported a
                  backup or added items while AI was offline.
                </Text>
              </div>
            </div>
          </Card>
        </section>

        {/* AI Learning Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>AI Learning</h3>

          <Card className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.infoBox}>
                <Callout.Root size="1" color="purple">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    The AI learns from your accept/reject feedback to improve
                    matching accuracy over time. The more you use it, the better
                    it gets!
                  </Callout.Text>
                </Callout.Root>
              </div>

              {feedbackStats && feedbackStats.totalFeedback > 0 && (
                <>
                  <div className={styles.statsRow}>
                    <div className={styles.stat}>
                      <Text size="1" color="gray">
                        Total Feedback
                      </Text>
                      <Text size="5" weight="bold">
                        {feedbackStats.totalFeedback}
                      </Text>
                    </div>
                    <div className={styles.stat}>
                      <Text size="1" color="gray">
                        Accepted
                      </Text>
                      <Text size="5" weight="bold" style={{ color: "green" }}>
                        {feedbackStats.acceptedCount}
                      </Text>
                    </div>
                    <div className={styles.stat}>
                      <Text size="1" color="gray">
                        Rejected
                      </Text>
                      <Text size="5" weight="bold" style={{ color: "red" }}>
                        {feedbackStats.rejectedCount}
                      </Text>
                    </div>
                    <div className={styles.stat}>
                      <Text size="1" color="gray">
                        Accuracy
                      </Text>
                      <Text size="5" weight="bold">
                        {Math.round(feedbackStats.acceptanceRate * 100)}%
                      </Text>
                    </div>
                  </div>

                  {feedbackStats.totalFeedback >= 5 && (
                    <div className={styles.infoBox}>
                      <Callout.Root color="green">
                        <Callout.Text>
                          ✅ Enough feedback collected! The AI can now learn
                          from your preferences. Click "Update AI Learning" to
                          apply.
                        </Callout.Text>
                      </Callout.Root>
                    </div>
                  )}

                  {feedbackStats.totalFeedback < 5 && (
                    <div className={styles.infoBox}>
                      <Callout.Root color="amber">
                        <Callout.Text>
                          ⏳ Keep providing feedback! Need{" "}
                          {5 - feedbackStats.totalFeedback} more to start
                          learning.
                        </Callout.Text>
                      </Callout.Root>
                    </div>
                  )}
                </>
              )}

              {(!feedbackStats || feedbackStats.totalFeedback === 0) && (
                <div className={styles.infoBox}>
                  <Callout.Root color="blue">
                    <Callout.Text>
                      No feedback yet. Use the accept ✓ and reject ✗ buttons in
                      the AI Wear Logging page to start teaching the AI your
                      preferences.
                    </Callout.Text>
                  </Callout.Root>
                </div>
              )}

              <div className={styles.buttonGroup}>
                <Button
                  size="3"
                  onClick={handleUpdatePreferences}
                  disabled={
                    isUpdatingPreferences ||
                    !feedbackStats ||
                    feedbackStats.totalFeedback < 5
                  }
                  className={styles.primaryButton}
                >
                  {isUpdatingPreferences ? "Updating..." : "Update AI Learning"}
                </Button>

                <Button
                  size="3"
                  variant="outline"
                  color="red"
                  onClick={handleResetLearning}
                  disabled={
                    isResettingLearning ||
                    !feedbackStats ||
                    feedbackStats.totalFeedback === 0
                  }
                  className={styles.secondaryButton}
                >
                  {isResettingLearning ? "Resetting..." : "Reset Learning"}
                </Button>
              </div>

              <div className={styles.helpText}>
                <Text size="2" color="gray">
                  <strong>How it works:</strong> The AI analyzes your
                  accept/reject patterns to understand which items you prefer
                  (favorites, new items, specific brands, etc.)
                </Text>
                <Text size="2" color="gray">
                  <strong>When to update:</strong> After providing feedback on
                  10-20 outfit photos for best results.
                </Text>
                <Text size="2" color="gray">
                  <strong>Privacy:</strong> All learning happens locally on your
                  device. No data is sent anywhere.
                </Text>
              </div>
            </div>
          </Card>
        </section>

        {/* Data Repair Section */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Data Repair</h3>

          <Card className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.infoBox}>
                <Callout.Root size="1" color="orange">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    If you're experiencing issues like items disappearing or
                    appearing in the wrong places, this repair tool can fix data
                    inconsistencies.
                  </Callout.Text>
                </Callout.Root>
              </div>

              <div className={styles.buttonGroup}>
                <Button
                  size="3"
                  variant="outline"
                  onClick={handleRepairData}
                  disabled={isRepairing}
                  className={styles.flexButton}
                >
                  {isRepairing ? "Repairing..." : "Repair Data"}
                </Button>

                <Button
                  size="3"
                  variant="soft"
                  color="gray"
                  onClick={async () => {
                    await diagnoseAllItems();
                    setMessage({
                      type: "info",
                      text: "Diagnostic report printed to browser console (F12 → Console tab)",
                    });
                  }}
                  className={styles.flexButton}
                >
                  Run Diagnostic
                </Button>
              </div>

              <div className={styles.helpText}>
                <Text size="2" color="gray">
                  <strong>Repair:</strong> Fixes invalid categories, wear
                  counts, and missing fields.
                </Text>
                <Text size="2" color="gray">
                  <strong>Diagnostic:</strong> Shows detailed info in browser
                  console (for debugging).
                </Text>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
