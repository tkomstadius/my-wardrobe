# Image Upload & Serverless Processing — Architecture Analysis

## 1. Current Upload Flow

The app is a **fully client-side PWA** — there is no backend server today. All uploads happen
directly from the browser to Supabase.

**Item image, step by step (`AddItemPage.tsx` / `EditItemPage.tsx`):**

1. **File select** — `useImageUpload` hook (`src/hooks/useImageUpload.ts`) reads the picked file
   with `FileReader.readAsDataURL()`.
2. **Client-side compression** — `compressImage()` (`src/utils/imageCompression.ts`) draws the
   image to a `<canvas>`, resizes to max 1200×1200, and re-encodes as JPEG (quality 0.9). Returns
   a compressed data URL, which is held in React state as a live preview.
3. **Form submit** — the data URL is posted as a hidden form field (`IMAGE_URL_NAME`) through a
   React Router `clientAction`.
4. **Blob conversion** — `dataUrlToBlob()` (`src/utils/supabaseStorage.ts`) turns the data URL
   back into a `Blob`.
5. **Auth check** — `getCurrentUserId()` (`src/utils/supabase.ts`) calls
   `supabase.auth.getUser()`; throws if there's no session.
6. **Upload** — `uploadItemImage(userId, itemId, blob)` uploads directly to the private Supabase
   Storage bucket `wardrobe-images`, at path `{userId}/items/{itemId}.jpg`, with `upsert: true`.
7. **DB write** — the *storage path* (not a URL) is saved as `image_url` on the `wardrobe_items`
   row via `saveItem()` → `supabase.from('wardrobe_items').upsert(...)`.
8. **Redirect** to the category listing.

Outfit photos follow the identical pattern via `uploadOutfitPhoto()`, writing to
`{userId}/outfits/{outfitId}.jpg` and storing the path in `outfits.photo_url`.

**Read path:** `getSignedUrl()` / `getSignedUrls()` generate 7‑day signed URLs on demand,
cached in an in-memory `Map` + `localStorage` (`wardrobe_img_url_cache`, TTL 6.5 days) to avoid
re-signing on every render.

**Key point:** nothing happens to the image *after* it lands in Storage. No resizing on the
server, no thumbnailing, no background removal, no embedding generation. The `wardrobe_items`
table already has an `embedding real[]` column (`drizzle/0000_flaky_wendell_vaughn.sql:55`) and
CLAUDE.md documents planned AI files (`utils/aiEmbedding.ts`, `utils/aiMatching.ts`,
`utils/aiLearning.ts`, `utils/itemSuggestion.ts`) — **none of these exist in the codebase yet.**
The embedding column is currently unused/null for every row.

## 2. Where Supabase Storage Is Used

| File | Responsibility |
|---|---|
| `src/utils/supabaseStorage.ts` | All Storage I/O: `uploadItemImage`, `uploadOutfitPhoto`, `deleteImage`, `getSignedUrl(s)`, plus the signed-URL cache and `dataUrlToBlob` |
| `src/pages/AddItemPage.tsx` | Calls `uploadItemImage` in `clientAction` |
| `src/pages/EditItemPage.tsx` | Same, for edits/replacement images |
| `src/utils/storageCommands.ts` | Calls `getSignedUrl(s)` to resolve stored paths → signed URLs when reading items/outfits; calls `deleteImage` on item/outfit deletion |
| Bucket | Single private bucket `wardrobe-images`, path convention `{userId}/items/{itemId}.jpg` and `{userId}/outfits/{outfitId}.jpg` |

Everything goes through the **anon key + RLS**, directly from the browser — there is no
service-role key or backend proxy in the current code. Storage bucket policies aren't tracked in
this repo (Drizzle only manages Postgres schema, not Storage/Auth policies), so they live in the
Supabase dashboard.

## 3. How Items Are Stored in the Database

- **`wardrobe_items`** (`src/db/schema.ts`, `drizzle/0000_flaky_wendell_vaughn.sql`) — id (text,
  app-generated via `generateId()` = `${Date.now()}-${random}`), `image_url` (storage path),
  category/subCategory, wear tracking (`wear_count`, `wear_history[]`), price, flags
  (second-hand/dog-casual/handmade), rating, purchase date, archive fields, `embedding real[]`
  (unused today), timestamps, `user_id`.
- **`outfits`** — id, `photo_url` (storage path, nullable), `item_ids text[]`, notes, rating,
  timestamps, `user_id`.
- **`match_feedback`** / **`user_preferences`** — schema exists for a planned AI
  learning/matching feature; not currently written to or read by any code path found in `src/`.
- Access is exclusively through the Supabase JS client from the browser (`utils/storageCommands.ts`),
  never through Drizzle at runtime — Drizzle is dev-only, for generating/pushing migrations.
- **snake_case ↔ camelCase** mapping is manual: `mapRowToItem()` / `mapRowToOutfit()` on read,
  inline object literals on write (`saveItems()` in `storageCommands.ts:93-119`).
- All 4 tables have RLS keyed on `user_id`, populated from `getCurrentUserId()` client-side and
  enforced server-side by Postgres RLS policies (policies not present in this repo's SQL).

## 4. How Authentication Works

- **Supabase Auth, magic-link/OTP only** (`src/contexts/AuthContext.tsx`):
  - `sendOtp(email)` → `supabase.auth.signInWithOtp({ email })`
  - `verifyOtp(email, token)` → `supabase.auth.verifyOtp({ email, token, type: 'email' })`
  - Session state is driven entirely by `supabase.auth.onAuthStateChange`, stored in React
    context (`user`, `session`, `isAuthenticated`).
- `App.tsx` gates the whole route tree on `isAuthenticated`; unauthenticated users see
  `LoginPage`.
- `getCurrentUserId()` (`src/utils/supabase.ts`) is the single choke point every write/read
  passes through to attach `user_id`; it throws if unauthenticated.
- There is no server-side session validation today because there is no server — RLS policies in
  Postgres are the actual authorization boundary, not application code.
- The Supabase client is initialized with the **anon key** only (`VITE_SUPABASE_ANON_KEY`); no
  service-role key appears anywhere in the client bundle or repo.

## 5. Where a Serverless Processing Step Could Be Inserted

Two realistic insertion points, in order of how much they change the current architecture:

### Option A — Storage-triggered (event-driven, minimal client changes)
Supabase Storage can fire a **Database Webhook** (via `storage.objects` insert trigger) or you can
poll/react to new objects. On upload completion, a Postgres trigger/webhook calls a serverless
function (Netlify Function or Supabase Edge Function) with the object path. The function:
1. Downloads the image from Storage using a **service-role key** (server-side only, never
   shipped to the client).
2. Runs processing (embedding generation, thumbnailing, background removal, etc.).
3. Writes results back to the DB row (`UPDATE wardrobe_items SET embedding = ... WHERE id = ...`),
   again using the service-role key so RLS is bypassed safely on the server side.

This decouples processing from the upload request — the user isn't blocked waiting for it, and
retries/failures don't corrupt the item-save flow.

### Option B — Request-triggered (synchronous, simpler to reason about)
After step 6 in the current flow (`uploadItemImage` succeeds), the client calls a new Netlify
Function (e.g. `netlify/functions/process-item-image.ts` — the directory already exists and is
wired up in `netlify.toml`, just empty today) with `{ userId, itemId, storagePath }`. The function
authenticates the caller (verify the Supabase JWT passed in the `Authorization` header), downloads
the image with the service-role key, processes it, and updates the row before returning. The
client's `clientAction` awaits this before redirecting.

**Recommendation: Option A (event-driven).** It matches the "upload then background-process"
mental model that's already implicit in the unused `embedding` column, it doesn't add latency to
the item-save UX (currently instant/optimistic), and it isolates the service-role key from any
code path shared with the browser bundle. Option B is only preferable if the user needs to *see*
the processing result immediately (e.g., a background-removed image the same session).

## 6. Potential Risks

- **Service-role key exposure.** The current codebase has zero server-side secrets — introducing
  a service-role key in a Netlify Function is the first time this app holds a credential that
  bypasses RLS. Must never be prefixed `VITE_`, must never be logged, and the function must be
  the *only* place it's read from `process.env`.
- **RLS bypass blast radius.** Any bug in the new function's `WHERE user_id = ...` scoping (or
  omitting it because "we're already using the service role") could let processing for one user
  leak into another user's row. The function must re-derive/validate `user_id` from the verified
  JWT or from the Storage event payload's `owner` field, not trust a client-supplied `userId`.
- **Storage-trigger reliability.** Supabase Database Webhooks on `storage.objects` are a real but
  less-traveled path than table-row triggers; test delivery guarantees (at-least-once? retries on
  function 5xx?) before depending on it for correctness rather than best-effort enrichment.
- **Race condition with `upsert: true`.** Uploads use `upsert: true` at a deterministic path
  (`{userId}/items/{itemId}.jpg`), so re-uploading the same item (edit flow) re-triggers the
  webhook. The function must be idempotent — safe to run twice for the same path — since
  overwrite-uploads and retried webhook deliveries both replay the same event.
- **Client-side embedding model conflict.** CLAUDE.md documents a *planned* client-side FashionCLIP
  pipeline (`@huggingface/transformers`, in-browser). If a serverless embedding step is added
  too, decide now which one is authoritative — running both risks two different embedding spaces
  for the same column, silently breaking similarity search.
- **Cold starts / cost.** Netlify Functions cold-start and have execution time limits; if
  processing involves loading an ML model per invocation, watch both latency and the function's
  memory/time ceiling (default Netlify Functions cap around 10s on the free tier, 26s on some
  plans) — long-running embedding generation may need a queue or a different compute target.
- **No functions exist yet.** `netlify/functions/` is present in `netlify.toml` but currently
  empty — there's no established pattern in this repo for auth-checking, error handling, or
  environment config inside a function. The first one sets the convention for all that follow.
- **Signed URL cache invalidation.** If processing mutates the *image itself* (e.g., background
  removal that replaces the stored file), the existing signed-URL cache
  (`invalidateUrlCache` in `supabaseStorage.ts`) must be called for that path — otherwise the
  client keeps serving the old cached signed URL to the pre-processed image for up to 6.5 days.

## 7. Concrete Implementation Plan

1. **Choose the processing target first.** Decide what the serverless step actually does
   (embedding generation is the obvious first candidate given the unused `embedding` column and
   `match_feedback`/`user_preferences` tables already in the schema). This determines whether
   Option A or B fits, and whether it needs a service-role key at all (embedding generation +
   DB write does; pure read-only analytics might not).
2. **Set up the trigger.**
   - In Supabase dashboard: create a Database Webhook on `storage.objects` INSERT, filtered to
     the `wardrobe-images` bucket, pointing at a new Netlify Function URL.
   - Alternative: a Postgres trigger on `wardrobe_items` INSERT/UPDATE (since the row write
     already carries `id` and `user_id` cleanly, this avoids parsing Storage object paths).
3. **Add the function.** Create `netlify/functions/process-item-image.ts` (or `.mts` per
   Netlify's function format). Read `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` from Netlify
   env vars (set in Netlify dashboard, never in `.env` committed to the repo). Validate the
   incoming payload (path/user_id) against expected shape before doing anything.
4. **Idempotency guard.** Before processing, check whether `wardrobe_items.embedding` (or a new
   `processed_at` column) is already set for this `id`/path combination; skip if so, unless a
   `force` flag is passed (handles the `upsert: true` re-upload case).
5. **Download + process.** Use the service-role client to `storage.from('wardrobe-images').download(path)`,
   run the processing step, then `update()` the corresponding row scoped by both `id` **and**
   `user_id` (defense in depth even with service-role access).
6. **Cache invalidation (if the image itself changes).** Call equivalent of `invalidateUrlCache`
   logic server-side, or simply don't mutate the original file — write derived assets to a new
   path (e.g. `{userId}/items/{itemId}-thumb.jpg`) so the source of truth for the original photo
   never changes and the existing cache stays valid.
7. **Error handling & observability.** Log failures with enough context (`itemId`, `userId`,
   error) to Netlify function logs; consider a `processing_status` column
   (`pending`/`done`/`failed`) on `wardrobe_items` so the UI can show state and support manual
   retry, since this is a personal-use app without a dedicated ops/alerting setup.
8. **Local dev loop.** Use `netlify dev` (already configured via `netlify.toml`'s `[dev]` block)
   to run the function locally against a Supabase dev project; confirm the webhook can reach
   `localhost` via Netlify Dev's tunneling, or stub the trigger with a manual `curl` during
   development.
9. **Ship incrementally.** Land the function behind the trigger for *new* uploads first; backfill
   existing rows (nulls in `embedding`) with a one-off script/manual invocation rather than
   coupling backfill to the real-time path.
10. **Verify.** Confirm: (a) uploading a new item populates the field within a few seconds, (b)
    re-uploading the same item's image doesn't double-process or error, (c) a malformed/huge
    image fails gracefully without leaving the `wardrobe_items` row in a broken state, (d) another
    user's `user_id` can never be written to by a crafted payload.
