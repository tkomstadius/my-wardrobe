import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { mockProvider } from './mockProvider.ts';
import type { MetadataProvider } from './types.ts';

// Swap this binding for a real AI-backed MetadataProvider when ready (e.g. an OpenAI provider
// implementing the same interface) — nothing else in this file needs to change.
const provider: MetadataProvider = mockProvider;

// Must match the bucket used in src/utils/supabaseStorage.ts.
const BUCKET = 'wardrobe-images';

// Auto-injected by the Supabase platform into every deployed Edge Function — no manual secret
// configuration needed.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type ProcessingStatus = 'not_requested' | 'pending' | 'processing' | 'completed' | 'failed';

interface RequestBody {
  itemId?: string;
  imagePath?: string;
}

interface ItemRow {
  id: string;
  image_url: string;
  metadata: Record<string, unknown> | null;
  // PostgREST likely returns this as pgvector's raw text form, not a parsed JSON array — only
  // used for a null check below, so the exact shape doesn't matter.
  embedding: unknown;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // --- Auth ---------------------------------------------------------------
  // The gateway (verify_jwt = true in config.toml) already rejects missing/invalid JWTs before
  // this code runs. We still verify explicitly here: it's the only way to get the caller's
  // identity for logging, and it means this function stays correct even if that config changes.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('[process-item] Rejected: missing Authorization header');
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  // Client scoped to the caller's own JWT — every query below runs under their RLS policies, so
  // an item that isn't theirs simply won't be found. No service-role key is used or needed.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    console.error('[process-item] Rejected: could not verify caller identity:', authError?.message);
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  const userId = userData.user.id;

  // --- Input ---------------------------------------------------------------
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { itemId, imagePath } = body;
  if (!itemId || !imagePath) {
    return jsonResponse({ error: 'itemId and imagePath are required' }, 400);
  }

  // --- Retrieve item ---------------------------------------------------------------
  const { data: item, error: fetchError } = await supabase
    .from('wardrobe_items')
    .select('id, image_url, metadata, embedding')
    .eq('id', itemId)
    .single<ItemRow>();

  if (fetchError || !item) {
    console.error(
      `[process-item] Item ${itemId} not found for user ${userId}:`,
      fetchError?.message ?? 'no rows',
    );
    return jsonResponse({ error: 'Item not found' }, 404);
  }

  if (item.image_url !== imagePath) {
    console.error(
      `[process-item] imagePath mismatch for item ${itemId}: got ${imagePath}, expected ${item.image_url}`,
    );
    return jsonResponse({ error: 'imagePath does not match this item' }, 400);
  }

  // --- Skip if already processed ---------------------------------------------------------------
  if (item.metadata != null && item.embedding != null) {
    console.log(`[process-item] Item ${itemId} already has metadata and embedding, skipping`);
    return jsonResponse({ status: 'skipped', reason: 'already processed' }, 200);
  }

  const setStatus = async (status: ProcessingStatus) => {
    const { error } = await supabase
      .from('wardrobe_items')
      .update({ processing_status: status })
      .eq('id', itemId);
    if (error) {
      console.error(`[process-item] Failed to set processing_status=${status} for item ${itemId}:`, error.message);
    }
  };

  // Queued, then actively working — modeled as two distinct states now so nothing else has to
  // change if this ever moves behind a real queue instead of running synchronously.
  await setStatus('pending');

  try {
    await setStatus('processing');

    // --- Download image ---------------------------------------------------------------
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(imagePath);

    if (downloadError || !imageBlob) {
      throw new Error(`Failed to download image at ${imagePath}: ${downloadError?.message ?? 'no data'}`);
    }

    // --- Generate analysis (mocked) ---------------------------------------------------------------
    const analysis = await provider.analyze(imageBlob, { itemId });

    // --- Save ---------------------------------------------------------------
    const { error: updateError } = await supabase
      .from('wardrobe_items')
      .update({
        description: analysis.description,
        metadata: analysis.metadata,
        embedding: analysis.embedding,
        processing_status: 'completed' satisfies ProcessingStatus,
      })
      .eq('id', itemId);

    if (updateError) {
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log(`[process-item] Item ${itemId} processed successfully`);
    return jsonResponse({ status: 'completed' }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[process-item] Processing failed for item ${itemId}:`, message);
    await setStatus('failed');
    return jsonResponse({ status: 'failed', error: message }, 500);
  }
});
