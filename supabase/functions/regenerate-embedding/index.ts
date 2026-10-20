import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  MAX_DESCRIPTION_LENGTH,
  validateEmbedding,
} from '../process-item/services/analysisValidationService.ts';
import { embeddingGenerator } from '../process-item/services/embeddingGenerationService.ts';
import { createPersistenceService } from '../process-item/services/persistenceService.ts';

// Re-embeds a single piece of text (a manually-edited description) without touching
// description/metadata/ai_model/ai_prompt_version/ai_processed_at — those still correctly
// describe the (unaffected) AI-generated text fields. Reuses process-item's own services rather
// than duplicating them; this function is orchestration only, same as process-item's index.ts.

// Auto-injected by the Supabase platform into every deployed Edge Function — no manual secret
// configuration needed.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface RequestBody {
  itemId?: string;
  description?: string;
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
  // See process-item/index.ts for why this is checked explicitly in addition to the gateway's
  // own verify_jwt = true (config.toml).
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('[regenerate-embedding] Rejected: missing Authorization header');
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    console.error('[regenerate-embedding] Rejected: could not verify caller identity:', authError?.message);
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

  const { itemId, description } = body;
  if (!itemId || !description || !description.trim()) {
    return jsonResponse({ error: 'itemId and a non-empty description are required' }, 400);
  }
  // Same cap process-item enforces on generated descriptions — also bounds what one request can
  // spend on the embeddings API.
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return jsonResponse({ error: `description exceeds ${MAX_DESCRIPTION_LENGTH} characters` }, 400);
  }

  const persistence = createPersistenceService(supabase);

  // --- Retrieve item ---------------------------------------------------------------
  // Confirms the item exists and belongs to the caller (RLS) before doing any AI work.
  const item = await persistence.getItem(itemId);
  if (!item) {
    console.error(`[regenerate-embedding] Item ${itemId} not found for user ${userId}`);
    return jsonResponse({ error: 'Item not found' }, 404);
  }

  // Atomic check-and-set — see process-item/index.ts.
  let claimed: boolean;
  try {
    claimed = await persistence.claimProcessing(itemId);
  } catch (err) {
    console.error(`[regenerate-embedding] Could not claim item ${itemId}:`, err instanceof Error ? err.message : err);
    return jsonResponse({ status: 'failed', error: 'Could not start processing' }, 500);
  }
  if (!claimed) {
    console.log(`[regenerate-embedding] Item ${itemId} is already processing, skipping duplicate invocation`);
    return jsonResponse({ status: 'skipped', reason: 'already processing' }, 200);
  }

  try {
    const embedding = validateEmbedding(await embeddingGenerator.generate(description));
    await persistence.updateEmbedding(itemId, embedding);

    console.log(`[regenerate-embedding] Item ${itemId} re-embedded successfully`);
    return jsonResponse({ status: 'completed' }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[regenerate-embedding] Failed for item ${itemId}:`, message);
    await persistence.setStatus(itemId, 'failed');
    return jsonResponse({ status: 'failed', error: message }, 500);
  }
});
