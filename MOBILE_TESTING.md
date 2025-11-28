# Testing on Your iPhone

## Quick Start 🚀

### Step 1: Start the Mobile Dev Server

Stop your current dev server (Ctrl+C) and run:

```bash
pnpm dev:mobile
```

You'll see output like:
```
VITE v6.4.1  ready in 590 ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.123:3000/    ← Use this IP!
```

### Step 2: Get Your Network IP

The `Network` URL shows your computer's local IP address.

**If you don't see it, find it manually:**

**On Mac:**
```bash
ipconfig getifaddr en0
```

**Or:** System Settings → Network → WiFi → Details → Your IP

### Step 3: Open on iPhone

1. Make sure your **iPhone and computer are on the same WiFi network**
2. Open **Safari** on your iPhone
3. Go to the Network URL (e.g., `http://192.168.1.123:3000`)
4. The app should load! 🎉

---

## Important Notes

### ✅ Requirements:
- Both devices on same WiFi network
- No VPN running on either device
- Firewall allows port 3000 (usually automatic)

### 📱 iPhone-Specific Features:

**Camera Access:**
When you click "Upload Image" on iPhone, you'll get options:
- 📸 **Take Photo** (opens camera)
- 🖼️ **Photo Library** (browse existing photos)
- 📁 **Choose File** (Files app)

This works automatically! No special permissions needed for the file input.

### 🔒 HTTPS Note:

Some features (like geolocation) require HTTPS. For local development on your network, HTTP is fine for:
- ✅ Camera via file input
- ✅ Photo library access
- ✅ IndexedDB storage
- ✅ localStorage

---

## Troubleshooting

### "Can't connect" or "This site can't be reached"

**Check WiFi:**
```bash
# On Mac, verify both devices on same network
# iPhone: Settings → WiFi → Network name
# Mac: WiFi icon → Network name
```

**Try firewall:**
```bash
# Temporarily disable Mac firewall
# System Settings → Network → Firewall → Off
# (Remember to turn back on later)
```

**Check the IP:**
```bash
# Make sure you're using the right IP
ipconfig getifaddr en0
# or
ifconfig | grep "inet "
```

### "Connection refused"

Make sure you're running `pnpm dev:mobile` (with `:mobile`), not just `pnpm dev`.

### Slow loading on iPhone

This is normal for development builds. Production builds are much faster:
```bash
pnpm build
pnpm preview --host
```

---

## Testing Checklist on iPhone

Once connected, test these:

- [ ] Home page loads
- [ ] Navigate to "Add Item"
- [ ] Click "Upload Image" → Choose Photo Library
- [ ] Select a photo (it should compress)
- [ ] See green compression banner
- [ ] Fill in Type, Color, Category
- [ ] Click "Save Item"
- [ ] Navigate back to Home
- [ ] See your item in the category grid
- [ ] Close Safari and reopen → data persists (IndexedDB)
- [ ] Add 5+ items to test performance

---

## Alternative: USB Connection

If WiFi doesn't work, you can use USB:

1. Connect iPhone via Lightning/USB-C cable
2. Run `pnpm dev` (regular, not mobile)
3. On Mac: Open Safari → Develop → [Your iPhone] → localhost:3000

---

## For Remote Testing (Outside WiFi)

If you want to test from anywhere (not just home WiFi):

### Option 1: ngrok
```bash
# Install
brew install ngrok

# Run (after starting dev server)
ngrok http 3000

# You'll get a public URL like:
# https://abc123.ngrok.io
```

### Option 2: Deploy to Vercel/Netlify
For real device testing with HTTPS:
```bash
pnpm build
# Then deploy to Vercel/Netlify
```

---

## Tips

### Inspect on iPhone from Mac

1. iPhone: Settings → Safari → Advanced → Web Inspector: ON
2. Connect via USB
3. Mac Safari → Develop → [Your iPhone] → Your Page
4. Full DevTools available!

### Add to Home Screen

1. Safari → Share button
2. "Add to Home Screen"
3. Opens like a native app!
4. Works offline after first load (PWA-ready)

---

## Common Ports

- `3000` - Development server (Vite)
- `4173` - Preview server (production build)

Make sure no other apps are using port 3000.

---

## Security Note

The `--host` flag exposes your dev server to your local network. This is safe on your home WiFi, but:

- ⚠️ Don't use on public WiFi (coffee shop, airport)
- ⚠️ Anyone on your network can access it
- ✅ Only for development/testing
- ✅ Production apps should use HTTPS

---

**Ready?** Run `pnpm dev:mobile` and grab your iPhone! 📱✨

