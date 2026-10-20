import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { validateAnalysis } from './services/analysisValidationService.ts';
import { descriptionGenerator } from './services/descriptionGenerationService.ts';
import { embeddingGenerator } from './services/embeddingGenerationService.ts';
import { createImageRetrievalService } from './services/imageRetrievalService.ts';
import { metadataGenerator } from './services/metadataGenerationService.ts';
import { PROMPT_VERSION, VISION_MODEL } from './services/openai/config.ts';
import { createPersistenceService } from './services/persistenceService.ts';

// Auto-injected by the Supabase platform into every deployed Edge Function — no manual secret
// configuration needed.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface RequestBody {
  itemId?: string;
  imagePath?: string;
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

  // Client scoped to the caller's own JWT — passed into every service below, so every query
  // they run is governed by the caller's own RLS policies. No service-role key anywhere.
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

  // --- Wire up services ---------------------------------------------------------------
  const images = createImageRetrievalService(supabase);
  const persistence = createPersistenceService(supabase);

  // --- Retrieve item ---------------------------------------------------------------
  const item = await persistence.getItem(itemId);
  if (!item) {
    console.error(`[process-item] Item ${itemId} not found for user ${userId}`);
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

  // --- Claim (prevents duplicate concurrent processing) ------------------------------------------
  // Atomic check-and-set, so two simultaneous invocations can't both proceed. A stale claim left
  // by a crashed/timed-out run is reclaimable, so an item can't get stuck in 'processing' forever.
  let claimed: boolean;
  try {
    claimed = await persistence.claimProcessing(itemId);
  } catch (err) {
    console.error(`[process-item] Could not claim item ${itemId}:`, err instanceof Error ? err.message : err);
    return jsonResponse({ status: 'failed', error: 'Could not start processing' }, 500);
  }
  if (!claimed) {
    console.log(`[process-item] Item ${itemId} is already processing, skipping duplicate invocation`);
    return jsonResponse({ status: 'skipped', reason: 'already processing' }, 200);
  }

  try {
    const image = await images.download(imagePath);

    // Description and metadata are independent — generated in parallel. Embedding depends on the
    // description text (text-embedding-3-small takes text, not images), so it runs after.
    const [description, metadata] = await Promise.all([
      descriptionGenerator.generate(image),
      metadataGenerator.generate(image),
    ]);
    const embedding = await embeddingGenerator.generate(description);

    // Independent of provider — catches refusals, truncated output, or a schema-less response
    // from a future provider swap, before anything touches the database.
    const validated = validateAnalysis({ description, metadata, embedding });

    await persistence.saveAnalysis(itemId, {
      ...validated,
      model: VISION_MODEL,
      promptVersion: PROMPT_VERSION,
      processedAt: new Date().toISOString(),
    });

    console.log(`[process-item] Item ${itemId} processed successfully`);
    return jsonResponse({ status: 'completed' }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[process-item] Processing failed for item ${itemId}:`, message);
    await persistence.setStatus(itemId, 'failed');
    return jsonResponse({ status: 'failed', error: message }, 500);
  }
});
