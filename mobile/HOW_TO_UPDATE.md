# How to Update Expo to Latest Version

## Quick Fix (If you see "Expo CLI version outdated" warning)

The warning is usually harmless, but here's how to fix it:

### Option 1: Automated Script (Easiest)

```bash
cd /app/mobile
chmod +x UPDATE_EXPO.sh
./UPDATE_EXPO.sh
```

This will:
- Clear all caches
- Reinstall dependencies
- Update to latest compatible versions

---

### Option 2: Manual Steps

```bash
cd /app/mobile

# 1. Clear cache
rm -rf node_modules .expo
rm -f package-lock.json yarn.lock

# 2. Reinstall
npm install

# 3. Update Expo CLI globally (optional)
npm install -g expo-cli@latest

# 4. Start fresh
npm start -- --clear
```

---

### Option 3: Update Expo SDK

If you need to upgrade to a newer SDK:

```bash
cd /app/mobile

# Install expo-cli globally if not already
npm install -g expo-cli

# Run the upgrade helper
npx expo install --fix

# Or upgrade to specific SDK (e.g., SDK 53)
# expo upgrade 53
```

---

## Common Issues

### Issue: "This version of expo-cli is out of date"

**Fix:**
```bash
npm install -g expo-cli@latest
npm start
```

### Issue: "Incompatible dependencies"

**Fix:**
```bash
npx expo install --check
npx expo install --fix
```

### Issue: "Metro bundler won't start"

**Fix:**
```bash
npm start -- --clear
# Or
npx expo start -c
```

---

## Verify Installation

Check your versions:

```bash
# Check Expo version
expo --version

# Check package versions
npm list expo react react-native
```

**Expected versions:**
- Expo: 52.0.x or higher
- React: 18.3.1
- React Native: 0.76.5

---

## What the Warning Means

When you see "not latest version":
- ✅ Your project SDK (52.0.x) is fine
- ⚠️ Your global `expo-cli` might be old
- 🔧 Update global CLI: `npm install -g expo-cli@latest`

The warning **won't prevent** your app from running!

---

## After Updating

```bash
cd /app/mobile
npm start

# Then:
# - Press 'i' for iOS
# - Press 'a' for Android  
# - Scan QR for physical device
```

---

## Still Having Issues?

Try the nuclear option:

```bash
cd /app/mobile

# Remove everything
rm -rf node_modules .expo .expo-shared
rm package-lock.json yarn.lock

# Reinstall from scratch
npm install

# Clear all caches
npm start -- --reset-cache --clear
```

---

## Ignore the Warning

If everything works fine, you can safely ignore the warning:

```bash
# Just run normally
npm start
```

The app will work even with the warning message!

---

## Pro Tip

Set environment variable to suppress the warning:

```bash
export EXPO_NO_DOCTOR=1
npm start
```

Or add to your `~/.bashrc` or `~/.zshrc`:
```bash
echo 'export EXPO_NO_DOCTOR=1' >> ~/.bashrc
```
