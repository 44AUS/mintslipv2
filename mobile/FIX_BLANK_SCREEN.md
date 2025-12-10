# Fix Blank Screen - Step by Step

## Option 1: Quick Clear and Restart (Try This First!)

```bash
cd /app/mobile

# Stop any running Expo process (Ctrl+C if running)

# Clear cache
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared

# Reinstall
npm install

# Start fresh with cleared cache
npm start -- --clear
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator  
- OR scan QR code with Expo Go app on phone

## Option 2: Test with Simplified App

If Option 1 doesn't work, let's test with a basic version:

### Step 1: Backup current App.js
```bash
cd /app/mobile
mv App.js App.full.js
```

### Step 2: Use test version
```bash
cp App.test.js App.js
```

### Step 3: Start app
```bash
npm start
```

If this works (you see "DocuMint Mobile" with two buttons), then the issue is with the full app components.

### Step 4: Restore full app when ready
```bash
mv App.full.js App.js
```

## Option 3: Check What You're Seeing

### If you see NOTHING (completely blank):
```bash
# Clear everything
cd /app/mobile
rm -rf node_modules .expo
npm install
npm start -- --reset-cache
```

### If you see LOADING forever:
- Check your WiFi connection
- Try tunnel mode: `npm start -- --tunnel`
- Check firewall settings

### If you see ERROR screen:
- Read the error message
- Check Terminal for full error
- Common fixes:
  ```bash
  # For "Cannot find module"
  npm install
  
  # For "Unable to resolve"
  npm start -- --clear
  ```

### If you see WHITE screen:
Open dev menu on device:
- **Physical device**: Shake it
- **iOS Simulator**: Cmd+D
- **Android Emulator**: Cmd+M (Mac) or Ctrl+M (Windows)

Then tap "Reload"

## What You SHOULD See

When working correctly:

1. **Home Screen:**
   - Green header with "DocuMint"
   - Hero text "Generate Authentic Documents"
   - Three green pills (checkmarks)
   - Two large cards: "Pay Stub" and "Bank Statement"

2. **Pay Stub Screen:**
   - Green header with back arrow
   - Template selection (3 radio buttons)
   - Many input fields
   - Preview/summary at bottom
   - "Pay with PayPal" button

3. **Bank Statement Screen:**
   - Similar to Pay Stub
   - Transaction list with "+Add" button

## Still Not Working?

### Check These:

1. **Node/NPM versions:**
   ```bash
   node --version  # Should be v16 or higher
   npm --version   # Should be 8 or higher
   ```

2. **Expo is installed:**
   ```bash
   expo --version
   ```

3. **No other process on port 8081:**
   ```bash
   lsof -ti:8081
   # If shows a number, kill it:
   kill -9 $(lsof -ti:8081)
   ```

4. **Check Metro bundler logs:**
   When you run `npm start`, look for errors in red

5. **Check device/simulator logs:**
   - iOS: Xcode → Window → Devices and Simulators
   - Android: `adb logcat`

## Emergency: Rebuild from Scratch

If nothing works:

```bash
cd /app
rm -rf mobile
mkdir mobile
cd mobile

# Initialize new Expo project
npx create-expo-app@latest . --template blank

# Then we can gradually add back features
```

## What's the Most Common Issue?

95% of blank screens are caused by:

1. **Cache issues** → Fix: `npm start -- --clear`
2. **Missing dependencies** → Fix: `rm -rf node_modules && npm install`
3. **Port conflict** → Fix: Kill process on 8081
4. **Network issue** → Fix: Use tunnel mode
5. **JavaScript error** → Fix: Check Terminal for errors

## Need More Help?

Send me:
1. Output of `npm start` (full terminal text)
2. Any error messages
3. Device type (iOS/Android/Simulator)
4. What you see on screen (even if blank)
5. Node version: `node --version`

## Quick Diagnostic

Run this to check everything:

```bash
cd /app/mobile
echo "Node version:" && node --version
echo "NPM version:" && npm --version
echo "Checking dependencies..."
npm list --depth=0 | grep -E "expo|react|navigation"
echo "Checking files..."
ls -la src/
echo "Done!"
```

Copy the output and send it if you need help.
