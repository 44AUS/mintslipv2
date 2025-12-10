# DocuMint Mobile - React Native Expo App

A mobile version of DocuMint for generating professional pay stubs and bank statements on iOS and Android.

## Features

- 📱 Native iOS and Android support
- 🎨 3 templates each for pay stubs and bank statements
- 💳 PayPal payment integration
- 📦 ZIP downloads for multiple paystubs
- 📅 Date range selector
- 🎯 No backend required

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Installation

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Development
```bash
npm start
```

This opens Expo Dev Tools. Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your physical device

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Building for Production

### iOS (requires Mac)
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # App screens
│   ├── components/       # Reusable components
│   ├── utils/            # PDF generation utilities
│   └── navigation/       # Navigation setup
├── assets/              # Images and fonts
├── App.js              # Entry point
└── package.json        # Dependencies
```

## Technologies

- React Native
- Expo
- React Navigation
- NativeWind (Tailwind CSS for React Native)
- expo-print (PDF generation)
- JSZip (ZIP file creation)
- PayPal WebView

## License

MIT
