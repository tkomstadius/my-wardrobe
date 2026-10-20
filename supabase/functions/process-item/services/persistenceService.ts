import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { ProcessingStatus } from '../types.ts';

export interface ItemRow {
  id: string;
  image_url: string;
  metadata: Record<string, unknown> | null;
  // PostgREST likely returns this as pgvector's raw text form, not a parsed JSON array — only
  // used for a null check by the caller, so the exact shape doesn't matter.
  embedding: unknown;
  processing_status: ProcessingStatus | null;
}

export interface ItemAnalysis {
  description: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  model: string;
  promptVersion: number;
  processedAt: string;
}

/** A 'processing' claim older than this is treated as abandoned — the run that made it crashed or
 *  hit the Edge Function wall-clock limit before it could write 'completed'/'failed'. Comfortably
 *  above the longest a real run can take, so a live run is never stolen. */
export const STALE_PROCESSING_MS = 5 * 60 * 1000;

export interface PersistenceService {
  /** Null if the item doesn't exist, or isn't the caller's — RLS makes those indistinguishable. */
  getItem(itemId: string): Promise<ItemRow | null>;
  /** Atomically sets processing_status to 'processing' unless another run already holds a fresh
   *  claim. Returns false if it didn't get the claim (a concurrent run is still in progress). A
   *  single conditional UPDATE, so two simultaneous invocations can't both pass. */
  claimProcessing(itemId: string): Promise<boolean>;
  setStatus(itemId: string, status: ProcessingStatus): Promise<void>;
  saveAnalysis(itemId: string, analysis: ItemAnalysis): Promise<void>;
  /** Updates only the embedding — used by regenerate-embedding when a manually-edited
   *  description needs a fresh vector without touching description/metadata/ai_* provenance
   *  fields, which still correctly describe the (unaffected) original AI-generated text fields. */
  updateEmbedding(itemId: string, embedding: number[]): Promise<void>;
}

/** Uses the caller-scoped Supabase client passed in from the orchestrator — never a service-role
 *  client — so every read/write here stays governed by the caller's own RLS policies. */
export function createPersistenceService(supabase: SupabaseClient): PersistenceService {
  return {
    async getItem(itemId: string): Promise<ItemRow | null> {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, metadata, embedding, processing_status')
        .eq('id', itemId)
        .single<ItemRow>();

      if (error || !data) {
        console.error(`[persistenceService] Item ${itemId} not found:`, error?.message ?? 'no rows');
        return null;
      }

      return data;
    },

    async claimProcessing(itemId: string): Promise<boolean> {
      const now = new Date();
      const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS).toISOString();
      const { data, error } = await supabase
        .from('wardrobe_items')
        .update({
          processing_status: 'processing' satisfies ProcessingStatus,
          processing_started_at: now.toISOString(),
        })
        .eq('id', itemId)
        // Not currently processing, or processing but the claim is missing/stale (abandoned run).
        .or(
          'processing_status.is.null,processing_status.neq.processing,' +
            `processing_started_at.is.null,processing_started_at.lt.${staleBefore}`,
        )
        .select('id');

      if (error) {
        throw new Error(`Failed to claim item for processing: ${error.message}`);
      }

      return (data?.length ?? 0) > 0;
    },

    async setStatus(itemId: string, status: ProcessingStatus): Promise<void> {
      const { error } = await supabase
        .from('wardrobe_items')
        .update({ processing_status: status })
        .eq('id', itemId);

      if (error) {
        console.error(
          `[persistenceService] Failed to set processing_status=${status} for item ${itemId}:`,
          error.message,
        );
      }
    },

    async saveAnalysis(itemId: string, analysis: ItemAnalysis): Promise<void> {
      const { error } = await supabase
        .from('wardrobe_items')
        .update({
          description: analysis.description,
          metadata: analysis.metadata,
          embedding: analysis.embedding,
          ai_model: analysis.model,
          ai_prompt_version: analysis.promptVersion,
          ai_processed_at: analysis.processedAt,
          processing_status: 'completed' satisfies ProcessingStatus,
        })
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to save analysis: ${error.message}`);
      }
    },

    async updateEmbedding(itemId: string, embedding: number[]): Promise<void> {
      const { error } = await supabase
        .from('wardrobe_items')
        .update({ embedding, processing_status: 'completed' satisfies ProcessingStatus })
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to update embedding: ${error.message}`);
      }
    },
  };
}
