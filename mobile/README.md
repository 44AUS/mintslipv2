# MintSlip Mobile App

A true native mobile application for MintSlip document generation, built with React Native and Expo.

## Features

- ✅ Native UI components (no WebView)
- ✅ MintSlip design system (colors, typography, spacing)
- ✅ Bottom tab navigation
- ✅ Native authentication flow (Login, Signup, Guest mode)
- ✅ US Pay Stub Generator
- ✅ Canadian Pay Stub Generator
- ✅ Haptic feedback
- ✅ Native toast notifications
- ✅ Keyboard-aware forms
- ✅ Pull-to-refresh ready
- ✅ iOS & Android safe area handling

## Project Structure

```
/mobile
  /src
    /components      # Reusable UI components
      - Button.js
      - Input.js
      - Select.js
      - Card.js
      - SectionHeader.js
      - Toast.js
    /context         # React Context providers
      - AuthContext.js
    /navigation      # Navigation configuration
      - AuthNavigator.js
      - MainNavigator.js
      - RootNavigator.js
    /screens         # Screen components
      - SplashScreen.js
      - WelcomeScreen.js
      - LoginScreen.js
      - SignupScreen.js
      - HomeScreen.js
      - PaystubGeneratorScreen.js
      - CanadianPaystubGeneratorScreen.js
      - SettingsScreen.js
    /services        # API and backend services
      - api.js
    /styles          # Theme and styling
      - theme.js
  App.js             # Main entry point
  app.json           # Expo configuration
  package.json       # Dependencies
```

## Design System

The app preserves MintSlip's web design system:

### Colors
- **Primary**: #1a4731 (Deep Forest Green)
- **Primary Light**: #16a34a
- **Secondary**: #f0fdf4 (Pale Mint)
- **Accent**: #ccff00 (Electric Lime)
- **Background**: #ffffff
- **Foreground**: #1a1a1a

### Typography
- Headings: System font (bold)
- Body: System font (regular)
- Font sizes: xs(12), sm(14), base(16), lg(18), xl(20), 2xl(24), 3xl(30), 4xl(36)

### Spacing Scale
- xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, 2xl: 32, 3xl: 40, 4xl: 48

## Running the App

```bash
# Install dependencies
cd mobile
yarn install

# Start Expo development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android
```

## Building for Production

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## API Integration

The app connects to the MintSlip backend at:
- Production: https://native-paystubs.preview.emergentagent.com/api

All API calls are handled through `/src/services/api.js`

## Authentication Flow

1. **First Launch**: Shows WelcomeScreen with Sign In, Create Account, and Continue as Guest options
2. **Returning User**: Shows animated splash, then navigates to main app
3. **Auth State**: Managed by AuthContext, persisted in AsyncStorage

## Key Dependencies

- `expo` - Expo SDK
- `@react-navigation/*` - Navigation
- `@react-native-async-storage/async-storage` - Local storage
- `expo-haptics` - Haptic feedback
- `expo-linear-gradient` - Gradient backgrounds
- `@expo/vector-icons` - Icons (Ionicons)
