# MyWardrobe

A personal-use mobile web app for tracking and organizing wardrobe items and outfits with AI-assisted image recognition.

## Tech Stack

- **Frontend:** React 19 with TypeScript
- **Routing:** React Router 7
- **UI Components:** Radix UI Theme
- **Styling:** CSS Modules
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Linter/Formatter:** Biome
- **Testing:** Playwright

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm (install with `npm install -g pnpm`)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000/`

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Check for linting errors
pnpm lint:fix     # Auto-fix linting errors
pnpm format       # Format code with Biome
pnpm test         # Run Playwright tests
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable atomic components
│   ├── layout/          # Layout components
│   └── features/        # Feature-specific components
├── contexts/            # React Context providers
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── styles/             # Global styles and CSS modules
└── pages/              # Page-level components
```

## Project Status

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed implementation plan and progress tracking.

### Current Features

- ✅ Home page with category-based wardrobe organization
- ✅ Add new wardrobe items UI
  - Upload or capture photos
  - Categorize by type (Tops, Bottoms, Outerwear, Accessories)
  - Add details (type, color, brand)
- 🚧 Data persistence (in progress)
- 🚧 Edit existing items (planned)
- 🚧 AI-assisted item recognition (planned)

### Key Principles

- Mobile-first responsive design
- Dark mode UI
- Photo-first experience
- CSS Modules only (no Tailwind, avoid inline styles)
- TypeScript strict mode
- Functional components with hooks
- React Context for state management

## Browser Support

Optimized for mobile browsers with modern Web API support.

## License

Personal use project
