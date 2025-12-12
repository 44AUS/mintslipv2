#!/bin/bash

echo "🚀 Updating Expo and Dependencies..."
echo ""

cd /app/mobile

# Step 1: Clear all caches
echo "📦 Step 1: Clearing caches..."
rm -rf node_modules
rm -rf .expo
rm -rf .expo-shared
rm -f package-lock.json
rm -f yarn.lock
echo "✅ Cache cleared"
echo ""

# Step 2: Update package.json to latest versions
echo "📝 Step 2: Updating package.json..."
cat > package.json << 'EOF'
{
  "name": "documint-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "react-native-screens": "^4.3.0",
    "react-native-safe-area-context": "^4.14.0",
    "expo-print": "~13.0.1",
    "expo-file-system": "~18.0.4",
    "expo-sharing": "~13.0.0",
    "react-native-webview": "13.12.2",
    "jszip": "^3.10.1",
    "@expo/metro-runtime": "~4.0.0",
    "react-native-gesture-handler": "~2.20.2",
    "@react-native-picker/picker": "^2.9.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0"
  },
  "private": true
}
EOF
echo "✅ package.json updated"
echo ""

# Step 3: Install dependencies
echo "📦 Step 3: Installing dependencies (this may take a few minutes)..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 4: Verify Expo version
echo "🔍 Step 4: Verifying installation..."
npm list expo react react-native | head -10
echo ""

echo "✅ All done! You can now run:"
echo "   npm start"
echo ""
