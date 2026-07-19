import type { AiProcessingStatus } from '../types/wardrobe';
import { getCurrentUserId, supabase } from './supabase';

/**
 * Kicks off the process-item Edge Function without waiting for it to finish. Errors are logged,
 * not thrown — a failed invocation shouldn't block or fail the flow that triggered it (e.g. saving
 * a newly added item).
 */
export function triggerItemProcessing(itemId: string, imagePath: string): void {
  supabase.functions
    .invoke('process-item', { body: { itemId, imagePath } })
    .then(({ error }) => {
      if (error) {
        console.error(`Failed to invoke process-item for item ${itemId}:`, error.message);
      }
    })
    .catch((error: unknown) => {
      console.error(`Failed to invoke process-item for item ${itemId}:`, error);
    });
}

/**
 * Clears a previous analysis so process-item will actually reprocess instead of skipping (its
 * skip check only looks at whether metadata/embedding are set, not whether the photo changed).
 * Call this — and await it — before triggering processing after a photo replacement.
 */
export async function clearItemAiAnalysis(itemId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('wardrobe_items')
    .update({
      description: null,
      metadata: null,
      embedding: null,
      processing_status: 'not_requested',
    })
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to clear AI analysis for item ${itemId}: ${error.message}`);
  }
}

/** Lightweight status-only fetch, used for polling instead of reloading the full item. */
export async function getItemProcessingStatus(
  itemId: string,
): Promise<AiProcessingStatus | undefined> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('processing_status')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to fetch processing status for item ${itemId}: ${error?.message ?? 'not found'}`,
    );
  }

  return (data.processing_status as AiProcessingStatus) ?? undefined;
}
