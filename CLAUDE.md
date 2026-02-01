# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Wardrobe is a personal-use, mobile-first PWA for tracking wardrobe items and outfits. Data is stored in Supabase (Postgres + Storage) with magic link authentication. AI features (FashionCLIP embeddings) run client-side via Hugging Face Transformers.js.

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
pnpm drizzle-kit push       # Push schema directly to Supabase (dev)
```

## After Making Changes

Always run these checks before considering work complete:

1. **Lint**: `pnpm lint` — runs Biome check on the entire project
2. **TypeScript**: `pnpm exec tsc --noEmit` — full type check in strict mode
3. **Build verification**: `pnpm build` — ensures the production build succeeds (runs both tsc and Vite)
4. **Visual check**: run the dev server with `pnpm dev` and verify the change works in the browser

Fix any errors from steps 1-3 before committing. There are no automated tests yet (Playwright is installed but unconfigured).

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode) + **React Router 7** (loaders/actions pattern)
- **Supabase** (Postgres + Storage + Auth) — data and image storage, magic link authentication
- **Drizzle ORM** (dev only) — schema definition and migrations via `drizzle-kit`
- **Base UI** (`@base-ui/react`) for accessible component primitives
- **CSS Modules** for styling — no Tailwind, no inline styles
- **Vite 7** for bundling, **Biome** for linting/formatting, **pnpm** as package manager
- **Netlify** for deployment

## Environment Variables

Required in `.env` (see `.env.example`):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `DATABASE_URL` — Postgres connection string (for Drizzle migrations only, not used at runtime)

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

4 tables, all with `user_id` column and Row Level Security (RLS) policies:

- **`wardrobe_items`** — clothing items with image paths, categories, wear history, embeddings
- **`outfits`** — outfit records with photo paths, item ID arrays, ratings
- **`match_feedback`** — AI suggestion accept/reject feedback for learning
- **`user_preferences`** — learned AI preference weights

Schema defined in `src/db/schema.ts` (Drizzle). Runtime queries use Supabase JS client (not Drizzle — browser can't make TCP connections to Postgres).

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

- **WardrobeItem**: image, category/subCategory, wearCount, wearHistory[], price, tags, optional CLIP embedding vector
- **Outfit**: itemIds[], photo, rating, weather snapshot

### Key Directories

- `src/pages/` — route-level page components (one per route)
- `src/components/common/ui/` — Base UI wrapper components (Button, Card, Dialog, etc.)
- `src/components/common/form/` — form field components (TextInput, SelectInput, etc.)
- `src/components/layout/` — MainLayout with BottomNav
- `src/utils/` — business logic, DB access, AI integration, categories, stats calculations
- `src/db/` — Drizzle schema (used for migrations only)
- `src/contexts/` — AuthContext (Supabase Auth), WeatherContext (open-meteo API)
- `src/hooks/` — useImageUpload, useItemSearch

### Patterns

- **Router loaders** for data fetching (not useEffect). Pages export `clientLoader` and use `useLoaderData`.
- **Router actions** for form submissions. Pages export `clientAction` and use `Form` from React Router.
- **CSS Modules** everywhere: `import styles from "./Component.module.css"` — class composition via template literals.
- **Base UI wrapping**: UI components in `common/ui/` wrap `@base-ui/react` primitives with app-specific styling.
- **Image pipeline**: upload → canvas compression → optional AI background removal → upload to Supabase Storage → store path in DB → signed URL for display.
- **snake_case ↔ camelCase**: `mapRowToItem()`/`mapRowToOutfit()` in storageCommands handle mapping between Postgres column names and TypeScript types.

### AI Features

- FashionCLIP (Marqo) embeddings generated in-browser via `@huggingface/transformers`
- Model (~200-500MB) auto-cached in browser after first download
- `utils/aiEmbedding.ts` — model loading and vector generation
- `utils/aiMatching.ts` — cosine similarity matching for outfit suggestions
- `utils/aiLearning.ts` — feedback tracking and preference learning (Supabase-backed)
- `utils/itemSuggestion.ts` — weighted scoring algorithm (neglect days, weather, category)

### Migration (temporary)

- `utils/indexedDB.ts` — legacy IndexedDB wrapper, kept temporarily for data migration
- `utils/migrateFromIndexedDB.ts` — one-time tool to migrate IndexedDB data to Supabase
- After migration is confirmed: delete both files and remove `idb` dependency

## Code Style

- Biome enforces: single quotes, semicolons always, 100 char line width, 2-space indent
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- Components: PascalCase filenames. Utilities: camelCase filenames. Constants: SCREAMING_SNAKE_CASE.
- Categories system defined in `utils/categories.ts` — 8 main categories with predefined subcategories
