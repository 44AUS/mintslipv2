# 🚀 START HERE - Fix Your Blank Screen

## The Problem
You're seeing a blank/preview screen when trying to run the mobile app.

## The Solution (Choose One)

---

## ⚡ FASTEST FIX (90% Success Rate)

Copy and paste these commands:

```bash
cd /app/mobile
rm -rf node_modules .expo
npm install
npm start -- --clear
```

Wait for "Metro waiting..." then:
- Press **`i`** for iOS simulator
- Press **`a`** for Android emulator
- OR scan QR code with your phone

✅ **If this works**, you should see the DocuMint home screen with green header!

---

## 🧪 TEST MODE (If Above Doesn't Work)

Let's test with a simple version first:

```bash
cd /app/mobile

# Backup current version
mv App.js App.backup.js

# Use test version
cp App.test.js App.js

# Start
npm start
```

**You should now see:**
- A simple "DocuMint Mobile" title
- Two buttons for Pay Stub and Bank Statement
- Basic navigation working

**If test works but full app doesn't:**
The components need debugging. I can help fix specific errors.

---

## 📱 What Device Are You Using?

### Physical Phone (Easiest!)
1. Install **Expo Go** app from App Store/Play Store
2. Run `npm start` in terminal
3. Scan the QR code that appears
4. App loads on your phone!

### iOS Simulator (Mac Only)
```bash
cd /app/mobile
npm start
# Press 'i' when ready
```

### Android Emulator
```bash
cd /app/mobile  
npm start
# Press 'a' when ready
```

### Web Browser (Backup Option)
```bash
cd /app/mobile
npm start -- --web
```
Opens in browser - easier to debug!

---

## 🔍 What Should You See?

### When Working:
1. **Terminal shows:** `Metro waiting on exp://...`
2. **Screen shows:** Green header "DocuMint"
3. **Below header:** Hero text and feature pills
4. **Two cards:** Pay Stub ($10) and Bank Statement ($50)

### When NOT Working:
- Blank white screen → JavaScript error
- Stuck on loading → Network/connection issue  
- Error screen → Check terminal for details
- Nothing happens → Metro not started

---

## 🆘 Still Blank? Try This

### Step 1: Check Terminal for Errors
When you run `npm start`, do you see RED text?
- **YES** → Copy the error message (I can help fix it)
- **NO** → Continue to Step 2

### Step 2: Reload the App
On device:
- **Shake phone** → Tap "Reload"
- **iOS Simulator** → Press Cmd+R
- **Android** → Press R twice

### Step 3: Check Internet
Are you on WiFi? Same network for computer and phone?
- **NO** → Try: `npm start -- --tunnel`

### Step 4: Nuclear Option
```bash
cd /app/mobile
rm -rf node_modules .expo node_modules
npm install
npm start -- --reset-cache --clear
```

---

## 📋 Pre-Flight Checklist

Before running, verify:

```bash
# Check Node version (need 16+)
node --version

# Check NPM version  
npm --version

# Check you're in the right directory
pwd
# Should show: .../app/mobile

# Check files exist
ls src/
# Should show: components  navigation  screens  utils
```

---

## 🎯 Common Issues & Fixes

### Issue: "Cannot find module expo"
```bash
npm install expo@~52.0.0
```

### Issue: "Unable to resolve module"
```bash
npm start -- --clear
```

### Issue: "Port 8081 already in use"
```bash
kill -9 $(lsof -ti:8081)
npm start
```

### Issue: "Network request failed"
```bash
# Try tunnel mode
npm start -- --tunnel
```

### Issue: Red error screen with text
**Read the error!** It tells you what's wrong:
- "undefined is not an object" → Code bug
- "Cannot read property" → Missing data
- "Network" → Connection issue

Take a screenshot and I can help fix it.

---

## ✅ Success Checklist

You'll know it's working when:
- [ ] Terminal shows "Metro waiting on..."
- [ ] No red errors in terminal
- [ ] QR code appears (or simulator opens)
- [ ] App loads on device
- [ ] You see "DocuMint" green header
- [ ] Two document cards are visible
- [ ] Tapping cards navigates to forms

---

## 🎬 Quick Demo Commands

Once working, test these features:

```bash
# Test pay stub generation
1. Tap "Pay Stub" card
2. Select Template A
3. Fill: Name = "Test", Company = "Test Corp"
4. Fill: Start = 2025-01-01, End = 2025-01-14, Rate = 25
5. Tap PayPal button
6. See payment modal

# Test bank statement
1. Tap "Bank Statement" card  
2. Select Template A
3. Fill account details
4. Add transaction
5. Tap PayPal button
```

---

## 📞 Get Help

If none of this works, run this diagnostic:

```bash
cd /app/mobile
echo "=== DIAGNOSTIC INFO ===" > debug.txt
echo "Node: $(node --version)" >> debug.txt
echo "NPM: $(npm --version)" >> debug.txt
echo "Directory: $(pwd)" >> debug.txt
echo "Files:" >> debug.txt
ls -la >> debug.txt
echo "Dependencies:" >> debug.txt
npm list --depth=0 >> debug.txt
cat debug.txt
```

Copy the output and send it to me along with:
1. What you tried
2. What you see on screen
3. Any error messages
4. Device type (iPhone/Android/Simulator)

---

## 🎓 Understanding the Tech

**What happens when you run `npm start`:**
1. Metro bundler starts (JavaScript packager)
2. Expo server starts (dev server)
3. QR code shown (to connect device)
4. App code is bundled and sent to device
5. React Native renders the UI

**If any step fails, you get a blank screen!**

---

## 💡 Pro Tips

1. **Always clear cache first** when debugging
2. **Use tunnel mode** if on different networks
3. **Test on physical device** - simulators can be buggy
4. **Check terminal constantly** - errors show there first
5. **Shake device often** - reloading fixes many issues

---

## 🔄 Restore Full App

If you're using the test version and want the full app back:

```bash
cd /app/mobile
mv App.backup.js App.js
npm start -- --clear
```

---

## 📚 More Help

- **TROUBLESHOOTING.md** - Detailed error solutions
- **FIX_BLANK_SCREEN.md** - Additional fixes
- **SETUP_GUIDE.md** - Full setup instructions
- **Expo Docs** - https://docs.expo.dev

---

**Remember:** Most issues are fixed by clearing cache and reinstalling!

```bash
cd /app/mobile && rm -rf node_modules .expo && npm install && npm start -- --clear
```

**🎉 You've got this!**
