# MyWardrobe

A personal-use mobile web app for tracking and organizing wardrobe items and outfits. Built for iPhone with a photo-first experience.

## ✨ Features

### Wardrobe Management

- **Add items** with photos (upload or camera)
- **Organize by category**: Tops, Bottoms, Dresses/Jumpsuits, Outerwear, Shoes, Bags, Jewelry, Accessories
- **Track metadata**: Brand, price, purchase date, tags (thrifted, handmade, dog casual)
- **Initial wear count** for pre-owned items
- **Edit & delete** items with confirmation dialogs

### Wear Tracking

- **Log wear** with date tracking
- **Wear history** per item with ability to remove entries
- **Cost-per-wear** calculation
- **Recently worn badges** (today/this week)
- **Worn this week** section on home page
- **Quick wear** button on item cards

### Outfits

- **Create outfit collections** with multiple items
- **Optional outfit photos**
- **Rate outfits** on comfort, confidence, and creativity (1-5 scale)
- **Visual rating bars** on outfit cards
- **Editable creation dates** for cataloging old outfits
- **Outfit membership** shown on item detail pages

### Organization & Filters

- **Filter by category**, brand, and tags (thrifted, casual, handmade)
- **Recently added** and **most worn** filters
- **Brand suggestions** with autocomplete
- **Item selector** with sticky filters for quick navigation

### Data & Storage

- **IndexedDB storage** (50MB+, stores hundreds of items)
- **Automatic image compression** (~95% size reduction)
- **Backup & restore** via JSON export/import
- **Data repair utilities** for fixing inconsistencies
- **Storage info** display with usage stats

### PWA Features

- **Installable** on iPhone home screen
- **Works offline** after first load
- **Native-like experience**
- **Deployed on Netlify** with HTTPS

## 🛠️ Tech Stack

- **Frontend:** React 19 with TypeScript
- **Routing:** React Router 7
- **UI Components:** Radix UI Theme
- **Styling:** CSS Modules (zero inline styles)
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Linter/Formatter:** Biome
- **Testing:** Playwright
- **Storage:** IndexedDB with automatic image compression
- **Deployment:** Netlify

## 🚀 Getting Started

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

### Mobile Testing

```bash
# Start dev server accessible on local network
pnpm dev:mobile
```

Then open the Network URL on your iPhone (e.g., `http://192.168.1.123:3000`)

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm dev:mobile   # Start server on local network (for mobile testing)
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Check for linting errors
pnpm lint:fix     # Auto-fix linting errors
pnpm format       # Format code with Biome
```

## 📂 Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components (CheckboxField, RatingSlider, etc.)
│   ├── layout/          # Layout components (MainLayout, BottomNav)
│   └── features/        # Feature components (ItemCard)
├── contexts/            # React Context providers (WardrobeContext, OutfitContext)
├── hooks/               # Custom hooks (useImageUpload, useStorageInfo)
├── pages/               # Page components (HomePage, AddItemPage, etc.)
├── utils/               # Utilities (backup, compression, filters, storage)
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## 🎨 Design Principles

- **Mobile-first** responsive design
- **Dark mode** UI with Radix theme
- **Photo-first** experience
- **CSS Modules only** (no Tailwind, no inline styles)
- **TypeScript strict mode**
- **Functional components** with React Hooks
- **React Context** for state management (no Redux/Zustand)

## 🔜 Upcoming Features

- **AI-powered wear logging** via CLIP embeddings (in planning)
- **Statistics dashboard** with wardrobe insights
- **Global search** across items
- **Advanced filtering** and sorting options

## 📱 Browser Support

Optimized for:

- ✅ iOS Safari (iPhone)
- ✅ Chrome (Desktop & Android)
- ✅ Firefox
- ✅ Edge

## 📝 License

Personal use project
