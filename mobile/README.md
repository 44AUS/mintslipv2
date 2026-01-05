# MintSlip Mobile App

A React Native mobile app that wraps the MintSlip website (https://mintslip.com) in a native WebView.

## Features

- Full access to mintslip.com within a native mobile app
- Android back button navigation support
- Pull-to-refresh functionality
- Stripe payment integration support
- File download support
- Smooth loading experience with loading indicator

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

```bash
cd mobile
npm install
# or
yarn install
```

### Run the App

```bash
# Start the development server
npm start
# or
yarn start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### Testing on Device

1. Install the **Expo Go** app on your phone (iOS App Store or Google Play)
2. Run `npm start` in the mobile directory
3. Scan the QR code with your phone's camera (iOS) or Expo Go app (Android)

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI: `npm install -g eas-cli`
2. Login to Expo: `eas login`
3. Configure your project: `eas build:configure`
4. Build for Android: `eas build --platform android`
5. Build for iOS: `eas build --platform ios`

### APK Download

After building with EAS, you'll receive a link to download the APK (Android) or IPA (iOS) file.

## Configuration

- **Website URL**: The app loads `https://mintslip.com` by default
- To change the URL, edit the `MINTSLIP_URL` constant in `App.js`

## App Structure

```
mobile/
├── App.js              # Main app with WebView
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── assets/             # App icons and splash screen
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── README.md
```

## Customization

### Change App Icon
Replace the following files in the `assets` folder:
- `icon.png` (1024x1024px) - App store icon
- `adaptive-icon.png` (1024x1024px) - Android adaptive icon
- `splash.png` - Splash screen image

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

## Troubleshooting

### WebView not loading
- Ensure your device has internet connectivity
- Check if mintslip.com is accessible from your device

### Build issues
- Run `expo doctor` to check for issues
- Clear cache: `expo start -c`

## Support

For issues with the mobile app, contact support@mintslip.com
