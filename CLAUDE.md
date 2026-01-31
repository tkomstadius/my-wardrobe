# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Wardrobe is a personal-use, mobile-first PWA for tracking wardrobe items and outfits. It runs entirely in the browser with no backend — data is stored in IndexedDB and AI features (FashionCLIP embeddings) run client-side via Hugging Face Transformers.js.

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

## Tech Stack

- **React 19** + **TypeScript 5.9** (strict mode) + **React Router 7** (loaders/actions pattern)
- **Base UI** (`@base-ui/react`) for accessible component primitives
- **CSS Modules** for styling — no Tailwind, no inline styles
- **IndexedDB** (via `idb`) for persistent storage (images stored as Blobs)
- **Vite 7** for bundling, **Biome** for linting/formatting, **pnpm** as package manager
- **Netlify** for deployment

## Architecture

### Data Flow

Components never access IndexedDB directly. The layers are:

1. **Pages** use React Router `clientLoader`/`clientAction` for data fetching and mutations
2. **`utils/storageCommands.ts`** — high-level business operations (add/edit items, log wear, etc.)
3. **`utils/indexedDB.ts`** — low-level DB wrapper handling Blob↔DataURL conversion

### Core Domain Models (`src/types/`)

- **WardrobeItem**: image, category/subCategory, wearCount, wearHistory[], price, tags, optional CLIP embedding vector
- **Outfit**: itemIds[], photo, rating, weather snapshot

### Key Directories

- `src/pages/` — route-level page components (one per route)
- `src/components/common/ui/` — Base UI wrapper components (Button, Card, Dialog, etc.)
- `src/components/common/form/` — form field components (TextInput, SelectInput, etc.)
- `src/components/layout/` — MainLayout with BottomNav
- `src/utils/` — business logic, DB access, AI integration, categories, stats calculations
- `src/contexts/` — WeatherContext (open-meteo API)
- `src/hooks/` — useImageUpload, useItemSearch, useStorageInfo

### Patterns

- **Router loaders** for data fetching (not useEffect). Pages export `clientLoader` and use `useLoaderData`.
- **Router actions** for form submissions. Pages export `clientAction` and use `Form` from React Router.
- **CSS Modules** everywhere: `import styles from "./Component.module.css"` — class composition via template literals.
- **Base UI wrapping**: UI components in `common/ui/` wrap `@base-ui/react` primitives with app-specific styling.
- **Image pipeline**: upload → canvas compression → optional AI background removal → Blob storage in IndexedDB → DataURL conversion for display.

### AI Features

- FashionCLIP (Marqo) embeddings generated in-browser via `@huggingface/transformers`
- Model (~200-500MB) auto-cached in browser after first download
- `utils/aiEmbedding.ts` — model loading and vector generation
- `utils/aiMatching.ts` — cosine similarity matching for outfit suggestions
- `utils/itemSuggestion.ts` — weighted scoring algorithm (neglect days, weather, category)

## Code Style

- Biome enforces: single quotes, semicolons always, 100 char line width, 2-space indent
- TypeScript strict mode with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`
- Components: PascalCase filenames. Utilities: camelCase filenames. Constants: SCREAMING_SNAKE_CASE.
- Categories system defined in `utils/categories.ts` — 8 main categories with predefined subcategories
