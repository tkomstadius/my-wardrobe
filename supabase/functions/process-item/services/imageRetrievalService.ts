import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

// Must match the bucket used in src/utils/supabaseStorage.ts.
const BUCKET = 'wardrobe-images';

export interface ImageRetrievalService {
  download(imagePath: string): Promise<Blob>;
}

/**
 * Uses the caller-scoped Supabase client passed in from the orchestrator — never a service-role
 * client — so image access stays governed by the same Storage policies as everywhere else in
 * the app.
 */
export function createImageRetrievalService(supabase: SupabaseClient): ImageRetrievalService {
  return {
    async download(imagePath: string): Promise<Blob> {
      const { data, error } = await supabase.storage.from(BUCKET).download(imagePath);

      if (error || !data) {
        throw new Error(`Failed to download image at ${imagePath}: ${error?.message ?? 'no data'}`);
      }

      return data;
    },
  };
}
