# Troubleshooting Blank Screen

## Quick Fixes

### 1. Clear Cache and Reinstall
```bash
cd /app/mobile

# Clear everything
rm -rf node_modules
rm -rf .expo
rm yarn.lock

# Reinstall
npm install

# Start with cleared cache
npm start -- --clear
```

### 2. Check for Errors in Terminal
When you run `npm start`, look for:
- ❌ Red error messages
- ⚠️  Yellow warnings about missing packages
- ✅ "Metro waiting on..." means it's working

### 3. Try Basic Test
Replace `App.js` temporarily with this simple test:

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello DocuMint!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 24,
    color: '#1a4731',
  },
});
```

If this works, the issue is with navigation or components.

### 4. Check Device/Simulator
- **Physical Device**: Shake device and tap "Reload"
- **iOS Simulator**: Press Cmd+R
- **Android Emulator**: Press R twice quickly

### 5. Enable Debug Mode
In Expo app on device:
1. Shake device
2. Tap "Debug Remote JS"
3. Open browser console to see errors

### 6. Check Specific Errors

#### Error: "Unable to resolve module"
```bash
npm install
npm start -- --clear
```

#### Error: "Unable to find expo"
```bash
npm install expo@~52.0.0
```

#### Error: "Cannot read property 'navigate'"
The navigation isn't set up. Make sure you're running the full app, not the test.

## Step-by-Step Verification

### Step 1: Dependencies
```bash
cd /app/mobile
npm list expo react react-native
```

Should show:
- expo@~52.0.0
- react@18.3.1
- react-native@0.76.5

### Step 2: Start Metro
```bash
npm start
```

Wait for: `Metro waiting on exp://192.168.x.x:8081`

### Step 3: Connect Device
- Scan QR code with Expo Go app
- OR press 'i' for iOS simulator
- OR press 'a' for Android emulator

### Step 4: Watch for Errors
Terminal should show:
```
› Opening on iOS...
› Opened http://localhost:19006/
```

### Step 5: Check App
- Should see green header "DocuMint"
- Should see hero text
- Should see two cards (Pay Stub, Bank Statement)

## Common Issues

### Issue: White/Blank Screen
**Causes:**
1. JavaScript error (check terminal)
2. Navigation not initialized
3. Components not rendering
4. Style issue hiding content

**Fix:**
```bash
# Clear and restart
rm -rf node_modules .expo
npm install
npm start -- --clear
```

### Issue: "Network Error" or Can't Connect
**Fix:**
1. Ensure device and computer on same WiFi
2. Try tunnel mode: `npm start -- --tunnel`
3. Check firewall settings

### Issue: Red Error Screen
Read the error message carefully:
- "Cannot find module" → Missing dependency
- "undefined is not an object" → Code error
- "Network request failed" → Connection issue

### Issue: Simulator/Emulator Won't Open
**iOS:**
```bash
sudo xcode-select --switch /Applications/Xcode.app
```

**Android:**
```bash
# Open Android Studio
# Tools → AVD Manager
# Start emulator manually
```

## Diagnostic Commands

### Check Installation
```bash
cd /app/mobile
node --version  # Should be v16+
npm --version   # Should be 8+
expo --version  # Should work
```

### Check App Structure
```bash
ls -la src/
# Should see: components, navigation, screens, utils
```

### Check Dependencies
```bash
npm list --depth=0
# Should see all packages
```

### Test Metro Bundler
```bash
npm start
# Should start without errors
```

## If Nothing Works

### Nuclear Option - Fresh Install
```bash
cd /app
rm -rf mobile/node_modules
rm -rf mobile/.expo
rm mobile/yarn.lock
rm mobile/package-lock.json

cd mobile
npm install
npm start -- --reset-cache
```

### Alternative: Run Web Version
```bash
npm start -- --web
```
Opens in browser - easier to debug

## Get Help

If still not working, provide:
1. Screenshot of terminal output
2. Error messages (full text)
3. What you see on screen
4. Device type (iOS/Android/Simulator)
5. Steps you've tried

## Working Test App

If all else fails, here's a minimal working version:

**App.js:**
```javascript
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DocuMint Mobile</Text>
      <Button title="Pay Stub" onPress={() => navigation.navigate('Paystub')} />
      <Button title="Bank Statement" onPress={() => navigation.navigate('Bank')} />
    </View>
  );
}

function PaystubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Stub Form</Text>
      <Text>Form goes here</Text>
    </View>
  );
}

function BankScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bank Statement Form</Text>
      <Text>Form goes here</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Paystub" component={PaystubScreen} />
        <Stack.Screen name="Bank" component={BankScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

This should definitely work. If it does, gradually add back features.
