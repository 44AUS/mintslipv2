# MintSlip Mobile App

A React Native mobile app for MintSlip with a native welcome screen and WebView integration.

## Features

- **Native Welcome Screen** - Beautiful onboarding with Sign In, Create Account, and Continue as Guest options
- **Seamless WebView Integration** - Full access to mintslip.com within a native wrapper
- **Consistent UI** - Matches the MintSlip web design system (green theme, similar styling)
- **Smart Navigation** - Remembers if user has seen the welcome screen
- **Android Back Button Support** - Native back navigation handling
- **Pull-to-Refresh** - Easy page refresh on mobile

## App Flow

1. **First Launch** → Welcome Screen with options:
   - Sign In → Opens login page
   - Create Account → Opens signup page
   - Continue as Guest → Opens main website

2. **Subsequent Launches** → Goes directly to main website (remembers preference)

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

```bash
cd mobile
yarn install
```

### Run the App

```bash
# Start the development server
yarn start

# Run on Android
yarn android

# Run on iOS
yarn ios
```

### Testing on Device

1. Install **Expo Go** app on your phone
2. Run `yarn start` in the mobile directory
3. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

## Project Structure

```
mobile/
├── App.js                      # Main app - navigation logic
├── src/
│   └── screens/
│       ├── WelcomeScreen.js    # Native welcome/onboarding screen
│       └── WebViewScreen.js    # WebView wrapper for mintslip.com
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── assets/                     # App icons and splash screen
└── README.md
```

## Building for Production

### Using EAS Build (Recommended)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android  # For Android APK
eas build --platform ios      # For iOS IPA
```

## Customization

### Reset Welcome Screen (for testing)

To show the welcome screen again, clear AsyncStorage:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('@mintslip_has_launched');
```

### Change App Colors

Edit the color values in `WelcomeScreen.js`:
- Primary Green: `#16a34a`
- Background: `#f0fdf4`
- Text Dark: `#1e293b`
- Text Light: `#64748b`

### Change App Icon/Splash

Replace files in `assets/` folder:
- `icon.png` (1024x1024px)
- `splash.png`
- `adaptive-icon.png`

## Tech Stack

- React Native 0.81.5
- Expo SDK 54
- expo-linear-gradient
- react-native-webview
- @react-native-async-storage/async-storage

## Support

For issues, contact support@mintslip.com
