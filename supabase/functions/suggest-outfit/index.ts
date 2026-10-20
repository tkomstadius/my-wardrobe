import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { createCandidateGatheringService } from './services/candidateGatheringService.ts';
import { outfitComposer, type OutfitWeather } from './services/outfitCompositionService.ts';
import { validateSuggestion } from './services/outfitValidationService.ts';

// Auto-injected by the Supabase platform into every deployed Edge Function — no manual secret
// configuration needed.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface RequestBody {
  weather?: OutfitWeather | null;
  mood?: string | null;
  excludeItemIds?: string[];
  avoidItemIds?: string[];
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
  // See process-item/index.ts for why this is checked explicitly in addition to the gateway's own
  // verify_jwt = true (config.toml).
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.error('[suggest-outfit] Rejected: missing Authorization header');
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  // Client scoped to the caller's own JWT — passed into every service below, so every query it
  // runs is governed by the caller's own RLS policies. No service-role key anywhere.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    console.error('[suggest-outfit] Rejected: could not verify caller identity:', authError?.message);
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

  const weather = body.weather ?? null;
  const mood = body.mood ?? null;
  const excludeItemIds = body.excludeItemIds ?? [];
  const avoidItemIds = body.avoidItemIds ?? [];

  // --- Stateless: no processing_status to track, nothing is persisted ------------------------
  try {
    const pool = await createCandidateGatheringService(supabase).gather({
      excludeItemIds,
      avoidItemIds,
    });

    if (pool.candidates.length === 0) {
      console.log(`[suggest-outfit] No candidate items for user ${userId}`);
      return jsonResponse({ status: 'no_candidates' }, 200);
    }

    const candidateIds = new Set(pool.candidates.map((c) => c.id));
    const composed = await outfitComposer.compose(pool, weather, mood);
    const { itemIds, rationale } = validateSuggestion(composed, candidateIds);

    console.log(`[suggest-outfit] Suggested ${itemIds.length} items for user ${userId}`);
    return jsonResponse({ status: 'completed', itemIds, rationale }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[suggest-outfit] Failed for user ${userId}:`, message);
    return jsonResponse({ status: 'failed', error: message }, 500);
  }
});
