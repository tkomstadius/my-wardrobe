import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { Button } from '../components/common/ui/Button'
import { Callout } from '../components/common/ui/Callout'
import { Card } from '../components/common/ui/Card'
import { Text } from '../components/common/ui/Text'
import { getImageEmbedding } from '../utils/aiEmbedding'
import {
  clearAllFeedback,
  getFeedbackStats,
  resetUserPreferences,
  updatePreferencesFromFeedback,
} from '../utils/aiLearning'
import { loadItemsWithEmbeddings, updateItemEmbedding } from '../utils/storageCommands'
import styles from './SettingsPage.module.css'

export async function loader() {
  const items = await loadItemsWithEmbeddings()

  return { items }
}

export function SettingsPage() {
  const { items } = useLoaderData<typeof loader>()
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false)
  const [embeddingProgress, setEmbeddingProgress] = useState({
    current: 0,
    total: 0,
  })
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  // AI Learning state
  const [feedbackStats, setFeedbackStats] = useState<{
    totalFeedback: number
    acceptedCount: number
    rejectedCount: number
    acceptanceRate: number
  } | null>(null)
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false)
  const [isResettingLearning, setIsResettingLearning] = useState(false)

  // Count items without embeddings
  const itemsNeedingEmbeddings = items.filter((item) => !item.embedding)
  const hasEmbeddingGap = itemsNeedingEmbeddings.length > 0
  const hasAllEmbeddings = items.length > 0 && itemsNeedingEmbeddings.length === 0

  // Load feedback stats and cache size on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getFeedbackStats()
        setFeedbackStats(stats)
      } catch (error) {
        console.error('Failed to load feedback stats:', error)
      }
    }
    loadStats()
  }, [])

  const handleUpdatePreferences = async () => {
    try {
      setIsUpdatingPreferences(true)
      setMessage(null)

      const updatedPreferences = await updatePreferencesFromFeedback()

      setMessage({
        type: 'success',
        text: `AI learning updated! Processed ${updatedPreferences.totalFeedbackCount} feedback examples.`,
      })

      // Reload stats
      const stats = await getFeedbackStats()
      setFeedbackStats(stats)
    } catch (error) {
      console.error('Failed to update preferences:', error)
      setMessage({
        type: 'error',
        text: 'Failed to update AI learning. Please try again.',
      })
    } finally {
      setIsUpdatingPreferences(false)
    }
  }

  const handleResetLearning = async () => {
    if (!confirm('Are you sure you want to reset AI learning? This will clear all feedback and preferences.')) {
      return
    }

    try {
      setIsResettingLearning(true)
      setMessage(null)

      await clearAllFeedback()
      await resetUserPreferences()

      setMessage({
        type: 'info',
        text: 'AI learning has been reset to defaults.',
      })

      // Reload stats
      const stats = await getFeedbackStats()
      setFeedbackStats(stats)
    } catch (error) {
      console.error('Failed to reset learning:', error)
      setMessage({
        type: 'error',
        text: 'Failed to reset AI learning. Please try again.',
      })
    } finally {
      setIsResettingLearning(false)
    }
  }

  const handleGenerateEmbeddings = async (regenerateAll = false) => {
    setIsGeneratingEmbeddings(true)
    setMessage(null)

    // If regenerating all, process all items; otherwise only items without embeddings
    const itemsToProcess = regenerateAll ? items : itemsNeedingEmbeddings
    const total = itemsToProcess.length
    setEmbeddingProgress({ current: 0, total })

    let successCount = 0
    let errorCount = 0

    try {
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i]
        if (!item) continue

        try {
          const embedding = await getImageEmbedding(item.imageUrl)
          await updateItemEmbedding(item.id, embedding)
          successCount++
          setEmbeddingProgress({ current: i + 1, total })
        } catch (error) {
          console.error(`Failed to generate embedding for item ${item.id}:`, error)
          errorCount++
          // Continue with next item
        }
      }

      if (errorCount === 0) {
        setMessage({
          type: 'success',
          text: `✅ Successfully ${
            regenerateAll ? 'regenerated' : 'generated'
          } embeddings for all ${successCount} items!`,
        })
      } else {
        setMessage({
          type: 'info',
          text: `${
            regenerateAll ? 'Regenerated' : 'Generated'
          } embeddings for ${successCount} items. ${errorCount} items failed (check console for details).`,
        })
      }
    } catch (error) {
      console.error('Embedding generation failed:', error)
      setMessage({
        type: 'error',
        text: 'Failed to generate embeddings. Check console for details.',
      })
    } finally {
      setIsGeneratingEmbeddings(false)
      setEmbeddingProgress({ current: 0, total: 0 })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Settings</h2>
      </div>

      {message && (
        <div className={styles.message}>
          <Callout>{message.text}</Callout>
        </div>
      )}

      {/* AI Wear Logging Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>AI Wear Logging</h3>

        <Card className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.infoBox}>
              <Callout variant="outline">
                Enable AI-powered wear logging by generating embeddings for your wardrobe items. This is a one-time
                setup that allows the app to automatically recognize items in outfit photos.
              </Callout>
            </div>

            {hasEmbeddingGap && (
              <div className={styles.infoBox}>
                <Callout>
                  {itemsNeedingEmbeddings.length} {itemsNeedingEmbeddings.length === 1 ? 'item' : 'items'} need
                  embeddings for AI wear logging. Click below to generate them.
                </Callout>
              </div>
            )}

            {!hasEmbeddingGap && items.length > 0 && (
              <div className={styles.infoBox}>
                <Callout>
                  ✅ All {items.length} {items.length === 1 ? 'item has' : 'items have'} embeddings. AI wear logging
                  ready!
                </Callout>
              </div>
            )}

            <div className={styles.buttonGroup}>
              <Button
                onClick={() => handleGenerateEmbeddings(false)}
                disabled={isGeneratingEmbeddings || !hasEmbeddingGap}
              >
                {isGeneratingEmbeddings
                  ? `Generating... ${embeddingProgress.current}/${embeddingProgress.total}`
                  : `Generate Embeddings (${itemsNeedingEmbeddings.length} items)`}
              </Button>
              {hasAllEmbeddings && (
                <Button
                  onClick={() => {
                    if (
                      confirm(
                        'Regenerate all embeddings? This will update all items to use the latest fashion recognition model. This may take a while.',
                      )
                    ) {
                      handleGenerateEmbeddings(true)
                    }
                  }}
                  disabled={isGeneratingEmbeddings}
                >
                  Regenerate All Embeddings
                </Button>
              )}
            </div>

            {isGeneratingEmbeddings && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${(embeddingProgress.current / embeddingProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <Text size="1" color="gray" className={styles.progressText}>
                  Processing item {embeddingProgress.current} of {embeddingProgress.total}...
                </Text>
              </div>
            )}

            <div className={styles.helpText}>
              <Text size="2" color="gray">
                <strong>What are embeddings?</strong> AI "fingerprints" of your items that enable photo-based wear
                logging. Uses FashionCLIP for fashion-specific recognition.
              </Text>
              <Text size="2" color="gray">
                <strong>When to generate:</strong> For new items that don't have embeddings yet.
              </Text>
              <Text size="2" color="gray">
                <strong>When to regenerate all:</strong> After updating to a new AI model, or if you've imported items
                with old embeddings.
              </Text>
              <Text size="2" color="gray">
                <strong>How matching works:</strong> Uses cosine similarity to compare outfit photos with item
                embeddings. Higher similarity = better match.
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
              <Callout variant="outline">
                The AI learns from your accept/reject feedback to improve matching accuracy over time. The more you use
                it, the better it gets!
              </Callout>
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
                    <Text size="5" weight="bold" style={{ color: 'green' }}>
                      {feedbackStats.acceptedCount}
                    </Text>
                  </div>
                  <div className={styles.stat}>
                    <Text size="1" color="gray">
                      Rejected
                    </Text>
                    <Text size="5" weight="bold" style={{ color: 'red' }}>
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
                    <Callout>
                      ✅ Enough feedback collected! The AI can now learn from your preferences. Click "Update AI
                      Learning" to apply.
                    </Callout>
                  </div>
                )}

                {feedbackStats.totalFeedback < 5 && (
                  <div className={styles.infoBox}>
                    <Callout>
                      ⏳ Keep providing feedback! Need {5 - feedbackStats.totalFeedback} more to start learning.
                    </Callout>
                  </div>
                )}
              </>
            )}

            {(!feedbackStats || feedbackStats.totalFeedback === 0) && (
              <div className={styles.infoBox}>
                <Callout>
                  No feedback yet. Use the accept ✓ and reject ✗ buttons in the AI Wear Logging page to start teaching
                  the AI your preferences.
                </Callout>
              </div>
            )}

            <div className={styles.buttonGroup}>
              <Button
                onClick={handleUpdatePreferences}
                disabled={isUpdatingPreferences || !feedbackStats || feedbackStats.totalFeedback < 5}
              >
                {isUpdatingPreferences ? 'Updating...' : 'Update AI Learning'}
              </Button>

              <Button
                variant="destructive"
                onClick={handleResetLearning}
                disabled={isResettingLearning || !feedbackStats || feedbackStats.totalFeedback === 0}
              >
                {isResettingLearning ? 'Resetting...' : 'Reset Learning'}
              </Button>
            </div>

            <div className={styles.helpText}>
              <Text size="2" color="gray">
                <strong>How it works:</strong> The AI analyzes your accept/reject patterns to understand which items you
                prefer (favorites, new items, specific brands, etc.)
              </Text>
              <Text size="2" color="gray">
                <strong>When to update:</strong> After providing feedback on 10-20 outfit photos for best results.
              </Text>
              <Text size="2" color="gray">
                <strong>Privacy:</strong> Preference learning happens locally. Images are sent to a private HF Space
                only for embedding generation.
              </Text>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
