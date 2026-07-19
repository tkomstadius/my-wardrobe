import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { ProcessingStatus } from '../types.ts';

export interface ItemRow {
  id: string;
  image_url: string;
  metadata: Record<string, unknown> | null;
  // PostgREST likely returns this as pgvector's raw text form, not a parsed JSON array — only
  // used for a null check by the caller, so the exact shape doesn't matter.
  embedding: unknown;
}

export interface ItemAnalysis {
  description: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

export interface PersistenceService {
  /** Null if the item doesn't exist, or isn't the caller's — RLS makes those indistinguishable. */
  getItem(itemId: string): Promise<ItemRow | null>;
  setStatus(itemId: string, status: ProcessingStatus): Promise<void>;
  saveAnalysis(itemId: string, analysis: ItemAnalysis): Promise<void>;
}

/** Uses the caller-scoped Supabase client passed in from the orchestrator — never a service-role
 *  client — so every read/write here stays governed by the caller's own RLS policies. */
export function createPersistenceService(supabase: SupabaseClient): PersistenceService {
  return {
    async getItem(itemId: string): Promise<ItemRow | null> {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, metadata, embedding')
        .eq('id', itemId)
        .single<ItemRow>();

      if (error || !data) {
        console.error(`[persistenceService] Item ${itemId} not found:`, error?.message ?? 'no rows');
        return null;
      }

      return data;
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
          processing_status: 'completed' satisfies ProcessingStatus,
        })
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to save analysis: ${error.message}`);
      }
    },
  };
}
