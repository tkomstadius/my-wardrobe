# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Wardrobe is a personal-use, mobile-first PWA for tracking wardrobe items and outfits. Data is stored in Supabase (Postgres + Storage) with magic link authentication.

## Commands

```bash
pnpm dev              # Dev server (localhost:5173)
pnpm dev:mobile       # Dev server on local network (mobile testing)
pnpm build            # TypeScript check + Vite build
pnpm lint             # Biome lint check
pnpm lint:fix         # Auto-fix lint errors
pnpm format           # Biome format
pnpm test             # Playwright tests
```

### Database Commands

```bash
pnpm drizzle-kit generate   # Generate SQL migration from schema changes
```

`DATABASE_URL` must use Supabase's **session pooler** (port `5432`), not the transaction pooler
(port `6543`) — the transaction pooler drops session state that `drizzle-kit` depends on, which
makes it hang indefinitely rather than fail cleanly.

**Do not run `drizzle-kit push`.** It diffs the live database against `schema.ts` and treats
anything not declared there — including RLS policies, since this Drizzle version has no way to
declare policies in code — as safe to drop, and it applies statements sequentially rather than in
one transaction. A failed push can leave RLS disabled on a live table mid-migration. Use this flow
instead:

1. `pnpm drizzle-kit generate` to produce a migration file in `drizzle/`
2. Read the generated SQL before applying it. In particular, check any column being *replaced*
   (not just widened) — Drizzle will emit `ALTER COLUMN ... SET DATA TYPE` for a same-named
   column even when the old and new types are incompatible (e.g. `real[]` → `vector(n)`), which
   errors or silently mis-casts. Replace those with an explicit `DROP COLUMN` + `ADD COLUMN`.
3. Apply it directly against the DB: `psql "$DATABASE_URL" -1 -v ON_ERROR_STOP=1 -f drizzle/000X_name.sql`
   — `-1` wraps the whole file in a single transaction so a failure rolls back everything instead
   of leaving a half-applied schema.
4. Verify RLS is still enabled on every table afterward:
   `psql "$DATABASE_URL" -c "SELECT relname, relrowsecurity FROM pg_class WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace;"`

## After Making Changes

Always run these checks before considering work complete:

1. **Lint**: `pnpm lint` — runs Biome check on the entire project
2. **TypeScript**: `pnpm exec tsc --noEmit` — full type check in strict mode
3. **Build verification**: `pnpm build` — ensures the production build succeeds (runs both tsc and Vite)
4. **Visual check**: run the dev server with `pnpm dev` and verify the change works in the browser

Fix any errors from steps 1-3 before committing. There are no automated tests yet (Playwright is installed but unconfigured).

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode) + **React Router 7** (loaders/actions pattern)
- **Supabase** (Postgres + Storage + Auth + Edge Functions) — data and image storage, magic link authentication, server-side AI processing
- **Drizzle ORM** (dev only) — schema definition and migrations via `drizzle-kit`
- **Base UI** (`@base-ui/react`) for accessible component primitives
- **CSS Modules** for styling — no Tailwind, no inline styles
- **Vite 7** for bundling, **Biome** for linting/formatting, **pnpm** as package manager
- **Netlify** for deployment

## Environment Variables

Required in `.env` (see `.env.example`):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `DATABASE_URL` — Postgres connection string (for Drizzle migrations only, not used at runtime).
  Must be Supabase's session pooler (port `5432`) — see Database Commands below.

Required as **Supabase Edge Function secrets** (not in `.env` — set via
`supabase secrets set NAME=value`, never committed):

- `OPENAI_API_KEY` — used by `process-item`'s description/metadata/embedding services
- `OPENAI_VISION_MODEL` — optional, defaults to `gpt-4o-mini` if unset

## Architecture

### Data Flow

```
React Pages (loaders/actions)
  → utils/storageCommands.ts (business logic, camelCase↔snake_case mapping)
    → Supabase JS client (Postgres queries + RLS)
    → utils/supabaseStorage.ts (image upload/download, signed URLs)

Auth: contexts/AuthContext.tsx → Supabase Auth (magic link)
```

1. **Pages** use React Router `clientLoader`/`clientAction` for data fetching and mutations
2. **`utils/storageCommands.ts`** — high-level business operations (CRUD items/outfits, wear logging, brands)
3. **`utils/supabase.ts`** — Supabase client singleton + `getCurrentUserId()` helper
4. **`utils/supabaseStorage.ts`** — image upload/download to private `wardrobe-images` bucket

### Database

2 tables, both with `user_id` column and Row Level Security (RLS) policies:

- **`wardrobe_items`** — clothing items with image paths, categories, wear history, and AI
  metadata columns (`description`, `metadata` jsonb, `processing_status`, `embedding` —
  vector(1536), reserved for OpenAI `text-embedding-3-small`, HNSW-indexed — plus `ai_model`,
  `ai_prompt_version`, `ai_processed_at` recording *how* a given analysis was produced, so
  items processed under an old model/prompt can be found and selectively reprocessed later
  instead of reprocessing everything). Populated by the Edge Function described below.
- **`outfits`** — outfit records with photo paths, item ID arrays, ratings

Schema defined in `src/db/schema.ts` (Drizzle). Runtime queries use Supabase JS client (not Drizzle — browser can't make TCP connections to Postgres).

### AI Processing (Edge Functions)

Two deployed Supabase Edge Functions (Deno). Redeploy after changes:
`supabase functions deploy <name>` (requires `supabase link` — see project ref in
`supabase/config.toml`).

#### `supabase/functions/process-item/`

Analyzes an item photo and writes `description`, `metadata`, `embedding`, `ai_model`,
`ai_prompt_version`, `ai_processed_at`, and `processing_status` back to its `wardrobe_items` row.

**Structure** — `index.ts` only orchestrates; all actual work lives in `services/`, each
independently swappable:
- `services/imageRetrievalService.ts` — downloads the photo from Storage (never swapped)
- `services/persistenceService.ts` — all `wardrobe_items` reads/writes (never swapped):
  `getItem`, `setStatus`, `saveAnalysis` (full analysis + `ai_*` provenance fields),
  `updateEmbedding` (embedding only — used by regenerate-embedding below)
- `services/analysisValidationService.ts` — `validateAnalysis` checks description/metadata/embedding
  shape before anything is persisted (non-empty description under 2000 chars;
  `metadata.category`/`color`/`pattern`/`material` all non-empty strings; embedding exactly 1536
  finite numbers). Provider-agnostic — runs regardless of what generated the analysis. Also
  exports `validateEmbedding` standalone, reused by regenerate-embedding.
- `services/descriptionGenerationService.ts` — image → description text, via OpenAI Responses API.
  Plain text output, no schema needed for a single string.
- `services/metadataGenerationService.ts` — image → `{ category, color, pattern, material }`, via
  OpenAI Responses API with a strict Structured Outputs JSON schema. Independent of description
  generation by design (separate services, separate calls) — mock or real, the two aren't
  guaranteed internally consistent with each other, only each internally valid.
- `services/embeddingGenerationService.ts` — **text → vector**, not image → vector. Takes the
  generated description, not the photo, via OpenAI `text-embedding-3-small` (hardcoded, not
  env-overridable — the column's 1536 dimensions and HNSW index are built for this exact model).
  `index.ts` runs description + metadata generation in parallel, then feeds the description into
  embedding generation.
- `services/openai/client.ts` (`OPENAI_API_KEY` env var) and `openai/imageEncoding.ts`
  (Blob → base64 data URL) are shared plumbing used by the two vision services — not swappable
  interfaces themselves, just OpenAI-specific internals.
- `services/openai/config.ts` — `VISION_MODEL` (env `OPENAI_VISION_MODEL`, default `gpt-4o-mini`;
  recorded as `ai_model` on save) and `PROMPT_VERSION` (recorded as `ai_prompt_version`). **Bump
  `PROMPT_VERSION` by hand whenever either vision prompt changes meaningfully** — nothing does
  this automatically. Shared with regenerate-embedding.
- To swap any generation service for a different provider: write a new implementation of that
  service's exported interface and change the one exported binding at the bottom of that file —
  nothing in `index.ts`, `analysisValidationService.ts`, or the other services needs to change.
- Invoked with `POST { itemId, imagePath }` and the caller's `Authorization: Bearer <jwt>` header.
  No service-role key: every service is constructed with the caller-scoped client, so every query
  runs under the caller's own JWT — RLS is the authorization boundary (an item that isn't theirs
  is simply not found, not leaked).
- `processing_status` lifecycle: `not_requested` (DB default, set on item creation) → `pending` →
  `processing` → `completed` | `failed`, all driven by this function. Returns early (skip, no
  reprocessing) if `processing_status` is already `processing` (prevents duplicate concurrent
  runs) or if `metadata`/`embedding` are already both set — see the reprocessing note below for
  why that second one matters on photo edits.

#### `supabase/functions/regenerate-embedding/`

Re-embeds a single piece of text without touching `description`/`metadata`/`ai_*` fields. Exists
because manually editing the description (see below) needs the embedding to stay in sync without
re-running the full image pipeline (which would overwrite the manual correction). Reuses
process-item's `embeddingGenerationService.ts`, `persistenceService.ts`, and
`analysisValidationService.ts`'s `validateEmbedding` directly via relative import rather than
duplicating them — this function is orchestration only, same principle as process-item's
`index.ts`. Invoked with `POST { itemId, description }`, same auth model as process-item.

Both excluded from Biome (`!supabase/functions` in `biome.json`) — Deno code, different runtime
and style conventions than the rest of the app (npm: specifiers, `Deno.serve`, no Vite/tsc
coverage).

**Wired into the app**:
- `utils/aiProcessing.ts` — `triggerItemProcessing` / `triggerEmbeddingRegeneration`
  (fire-and-forget invokes), `getItemProcessingStatus` (lightweight poll query),
  `clearItemAiAnalysis` (nulls `description`/`metadata`/`embedding`/`ai_model`/`ai_prompt_version`/
  `ai_processed_at`, sets `processing_status` to `pending`; must be awaited before re-triggering
  after a photo change, since the skip check only looks at whether `metadata`/`embedding` are set
  — a stale-but-present analysis would otherwise make a re-trigger silently no-op instead of
  reprocessing the new photo).
- `hooks/useProcessingStatus.ts` — polls while a status is non-terminal, revalidates the route
  loader once it isn't.
- `AddItemPage` triggers processing after `saveItem` without awaiting it, then redirects to the
  item detail page with `?justAdded=true` so it force-watches even before the first `pending`
  write has landed. `EditItemPage`: if the photo changed, calls `clearItemAiAnalysis` + retriggers
  full processing (takes precedence over any manual text edits submitted in the same request,
  since a new photo needs fresh analysis regardless); else if only the description text changed,
  calls `triggerEmbeddingRegeneration` instead (metadata-only edits trigger nothing — metadata
  doesn't feed the embedding). Either case redirects with `?reprocessing=true` for the same
  force-watch. `ItemCategoryPage`/`ItemCard` don't force-watch — a card just shows a badge if an
  item's actual status happens to be non-terminal when rendered.
- `ItemCard` and `ItemDetailPage` render `ProcessingStatusBadge` (hidden for
  `not_requested`/`completed`); `ItemDetailPage` also offers a Retry button on `failed`
  (re-invokes `triggerItemProcessing`, which works because the skip check only looks at
  `metadata`/`embedding` presence).
- `ItemDetailPage` renders a read-only "AI Analysis" section showing `description` and a generic
  key/value list of `metadata` (not hardcoded to specific keys, so it won't need changes when a
  provider returns different attributes). Hidden when both are empty.
- `EditItemPage` has a separate, *editable* "AI Analysis" fieldset (description textarea +
  category/color/pattern/material inputs, matching metadataGenerationService.ts's schema) so a
  wrong AI result can be manually corrected — see the description-change → regenerate-embedding
  wiring above.

### Image Storage

- Images stored in private Supabase Storage bucket `wardrobe-images`
- DB stores **storage paths** (e.g., `{userId}/items/{itemId}.jpg`), not URLs
- Signed URLs (1hr expiry) generated at read time via `getSignedUrl()`/`getSignedUrls()`
- Upload pipeline: compress → upload Blob to Storage → store path in DB

### Authentication

- Magic link (email OTP) via Supabase Auth
- `AuthContext` wraps the app, gates all routes behind authentication
- `App.tsx` checks `isAuthenticated` — unauthenticated users see `LoginPage`

### Core Domain Models (`src/types/`)

- **WardrobeItem**: image, category/subCategory, wearCount, wearHistory[], price, tags
- **Outfit**: itemIds[], photo, rating, weather snapshot

### Key Directories

- `src/pages/` — route-level page components (one per route)
- `src/components/common/ui/` — Base UI wrapper components (Button, Card, Dialog, etc.)
- `src/components/common/form/` — form field components (TextInput, SelectInput, etc.)
- `src/components/layout/` — MainLayout with BottomNav
- `src/utils/` — business logic, DB access, categories, stats calculations
- `src/db/` — Drizzle schema (used for migrations only)
- `src/contexts/` — AuthContext (Supabase Auth), WeatherContext (open-meteo API)
- `src/hooks/` — useImageUpload, useItemSearch
- `supabase/functions/` — Edge Functions (Deno); see AI Processing above

### Patterns

- **Router loaders** for data fetching (not useEffect). Pages export `clientLoader` and use `useLoaderData`.
- **Router actions** for form submissions. Pages export `clientAction` and use `Form` from React Router.
- **CSS Modules** everywhere: `import styles from "./Component.module.css"` — class composition via template literals.
- **Base UI wrapping**: UI components in `common/ui/` wrap `@base-ui/react` primitives with app-specific styling.
- **Image pipeline**: upload → canvas compression → upload to Supabase Storage → store path in DB → signed URL for display.
- **snake_case ↔ camelCase**: `mapRowToItem()`/`mapRowToOutfit()` in storageCommands handle mapping between Postgres column names and TypeScript types.

## Code Style

- Biome enforces: single quotes, semicolons always, 100 char line width, 2-space indent
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- Components: PascalCase filenames. Utilities: camelCase filenames. Constants: SCREAMING_SNAKE_CASE.
- Categories system defined in `utils/categories.ts` — 8 main categories with predefined subcategories
