# Storage Implementation

## IndexedDB (Current Implementation)

MyWardrobe uses **IndexedDB** for storing wardrobe items and photos on your device.

### Why IndexedDB?

**Previous (localStorage):**
- ❌ 5-10MB limit
- ❌ Only ~3-5 high-res photos before hitting limits
- ❌ Stores images as base64 (33% larger than original)

**Current (IndexedDB):**
- ✅ 50MB+ storage (can request up to GBs)
- ✅ Store 100s-1000s of items with photos
- ✅ Images stored as Blobs (efficient binary format)
- ✅ Better performance with large datasets
- ✅ Works offline
- ✅ Supported on all modern browsers (iOS Safari included)

### How It Works

1. **On Your Device:** All data stored locally on your iPhone/device
2. **In Safari's Database:** Each website gets its own isolated database
3. **No Internet Required:** Works completely offline after first load
4. **No Cost:** 100% free, built into all modern browsers
5. **Privacy:** Your data never leaves your device

### Storage Capacity

- **Default quota:** ~50MB (varies by browser)
- **Can request:** Up to several GB if needed
- **Typical usage:** 100 items with photos ≈ 100-500MB
- **Limit:** Your device's available storage

### Data Structure

```
IndexedDB: MyWardrobeDB
└── Object Store: items
    ├── Item 1 (id, imageBlob, type, color, brand, category, etc.)
    ├── Item 2
    └── Item 3
```

### Key Files

- `src/utils/indexedDB.ts` - Low-level IndexedDB operations
- `src/utils/storage.ts` - High-level storage API
- `src/contexts/WardrobeContext.tsx` - State management with persistence
- `src/hooks/useStorageInfo.ts` - Check storage usage/quota

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| iOS Safari | ✅ Full | Works great on iPhone |
| Chrome | ✅ Full | Desktop & Android |
| Firefox | ✅ Full | All platforms |
| Edge | ✅ Full | Windows & Mac |

### Checking Storage Usage

You can use the `useStorageInfo` hook to see how much storage you're using:

```typescript
import { useStorageInfo } from '../hooks/useStorageInfo';

function MyComponent() {
  const storageInfo = useStorageInfo();
  
  if (storageInfo) {
    console.log(`Using ${storageInfo.usageInMB}MB of ${storageInfo.quotaInMB}MB`);
    console.log(`${storageInfo.percentageUsed}% full`);
  }
}
```

### Data Persistence

Your wardrobe data persists:
- ✅ After closing the browser
- ✅ After device restart
- ✅ Until you explicitly delete it or clear browser data
- ✅ No expiration (stays forever unless removed)

### Clearing Data

Data is only cleared if:
- User clears browser data/cache
- User uninstalls the browser app
- Device storage is critically low (iOS may clean up)

**Recommendation for production:** Add cloud backup option (future feature).

### Future Enhancements

- [ ] Cloud sync (optional) for cross-device access
- [ ] Export/import wardrobe data
- [ ] Automatic image compression for very large photos
- [ ] Storage usage warning when approaching quota

