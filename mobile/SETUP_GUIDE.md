# DocuMint Mobile - Complete Setup Guide

## Overview

This is the React Native Expo mobile version of DocuMint, converted from the web application. It provides native iOS and Android apps for generating professional pay stubs and bank statements.

## What's Different from Web App?

### Technology Stack Changes:
- **Navigation**: React Router → React Navigation
- **PDF Generation**: jsPDF → expo-print (HTML-to-PDF)
- **File Handling**: file-saver → expo-file-system + expo-sharing
- **PayPal**: Web SDK → WebView implementation
- **UI Components**: Radix UI → Custom React Native components
- **Styling**: Tailwind CSS → React Native StyleSheet (with NativeWind config)

### Features Preserved:
✅ All 3 pay stub templates (A, B, C)
✅ All 3 bank statement templates (A, B, C)
✅ PayPal payment integration ($10/paystub, $50/statement)
✅ Multiple paystub generation with date ranges
✅ ZIP file downloads for multiple documents
✅ Tax calculations and all form fields
✅ Professional UI design

## Prerequisites

1. **Node.js** (v16 or higher)
   ```bash
   node --version
   ```

2. **Expo CLI** (install globally)
   ```bash
   npm install -g expo-cli
   ```

3. **Development Environment**:
   - For iOS: Mac with Xcode
   - For Android: Android Studio with emulator
   - Or use physical devices with Expo Go app

## Installation Steps

### 1. Navigate to Mobile Directory
```bash
cd /app/mobile
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

This will install:
- React Native & Expo
- React Navigation
- expo-print, expo-file-system, expo-sharing
- react-native-webview (for PayPal)
- All other required packages

### 3. Create Asset Images (Optional)
The app needs these icon files in `assets/`:
- `icon.png` - 1024x1024 app icon
- `splash.png` - 1284x2778 splash screen
- `adaptive-icon.png` - 1024x1024 Android adaptive icon
- `favicon.png` - 48x48 web favicon

You can use any image editor or online tools to create these, or use Expo's default placeholders.

## Running the App

### Development Mode

Start the development server:
```bash
npm start
# or
expo start
```

This opens Expo Dev Tools in your browser. Then:

#### Option 1: Physical Device (Easiest)
1. Install "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in terminal/browser
3. App will load on your device

#### Option 2: iOS Simulator (Mac only)
```bash
npm run ios
# or press 'i' in the Expo terminal
```

#### Option 3: Android Emulator
```bash
npm run android
# or press 'a' in the Expo terminal
```

### First Run Checklist
- ✅ Home screen loads with two document cards
- ✅ Navigation to Pay Stub form works
- ✅ Navigation to Bank Statement form works
- ✅ All form fields are editable
- ✅ Template selection works
- ✅ Preview/summary shows correct calculations

## Testing Features

### 1. Test Pay Stub Generation

**Single Stub:**
1. Open Pay Stub form
2. Select a template (A, B, or C)
3. Fill in:
   - Employee name: "John Doe"
   - Company name: "Test Corp"
   - Start Date: "2025-01-01"
   - End Date: "2025-01-14"
   - Hourly Rate: "25"
4. Tap "Pay with PayPal"
5. Complete payment in WebView
6. PDF should generate and share dialog appears

**Multiple Stubs:**
1. Use date range spanning multiple pay periods
2. Example: Start "2025-01-01", End "2025-03-31" (bi-weekly = ~6 stubs)
3. Should create ZIP file with all PDFs

### 2. Test Bank Statement Generation

1. Open Bank Statement form
2. Select a template
3. Fill account details:
   - Name: "John Doe"
   - Account #: "123456789"
   - Month: "2025-01"
4. Add transactions (click "+ Add")
5. Fill transaction details
6. Tap "Pay $50.00 with PayPal"
7. PDF should generate after payment

### 3. Test PayPal Integration

The app uses PayPal Sandbox for testing:
- Client ID is already configured
- Use PayPal sandbox account or create one at developer.paypal.com
- In production, replace with live PayPal credentials

## Project Structure

```
mobile/
├── App.js                    # Entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js   # Navigation setup
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── PaystubFormScreen.js
│   │   └── BankStatementFormScreen.js
│   ├── components/
│   │   ├── Header.js
│   │   ├── Button.js
│   │   ├── Input.js
│   │   ├── Select.js
│   │   ├── Checkbox.js
│   │   ├── RadioGroup.js
│   │   └── PayPalWebView.js
│   └── utils/
│       ├── paystubTemplates.js      # HTML templates for PDFs
│       ├── paystubGenerator.js      # PDF generation logic
│       ├── bankStatementTemplates.js
│       └── bankStatementGenerator.js
└── assets/                   # App icons and images
```

## Common Issues & Solutions

### Issue: "Unable to resolve module"
**Solution**: 
```bash
rm -rf node_modules
npm install
expo start --clear
```

### Issue: PayPal WebView not loading
**Solution**: 
- Check internet connection
- Verify PayPal Client ID in PayPalWebView.js
- For Android, may need to enable JavaScript in WebView

### Issue: PDF not generating
**Solution**:
- Check console for errors
- Ensure all required fields are filled
- Try with simpler data first

### Issue: "Expo Go app doesn't support this"
**Solution**: 
Some features require development build:
```bash
expo prebuild
npm run ios  # or android
```

### Issue: Can't share/download files
**Solution**:
- Ensure expo-sharing is installed
- Check device permissions
- Try on different device/simulator

## Building for Production

### Prerequisites
1. Create Expo account: https://expo.dev
2. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```

### Build iOS App
```bash
# Configure project
eas build:configure

# Build for iOS
eas build --platform ios
```

### Build Android App
```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android
```

### Submit to Stores

**Apple App Store:**
```bash
eas submit --platform ios
```

**Google Play Store:**
```bash
eas submit --platform android
```

## Configuration Changes

### Change PayPal Client ID

Edit `/src/components/PayPalWebView.js`:
```javascript
const PAYPAL_CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
```

For production, use live PayPal credentials instead of sandbox.

### Change Prices

Edit the amount in:
- `PaystubFormScreen.js`: Line with `calculateNumStubs * 10`
- `BankStatementFormScreen.js`: `amount={50}`

### Customize Templates

PDF templates are in:
- `/src/utils/paystubTemplates.js`
- `/src/utils/bankStatementTemplates.js`

They use HTML/CSS, which is converted to PDF by expo-print.

### Change App Name/Icon

Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    ...
  }
}
```

Replace images in `/assets/` folder.

## Performance Tips

1. **Optimize Images**: Keep template HTML simple
2. **Batch Operations**: Show progress for multiple PDFs
3. **Cache Data**: Consider AsyncStorage for form data
4. **Error Handling**: Always wrap async operations in try-catch

## Next Steps

1. ✅ Test all features on iOS
2. ✅ Test all features on Android
3. ✅ Customize app icon and splash screen
4. ✅ Configure PayPal live credentials
5. ✅ Build and submit to app stores
6. 🚀 Launch!

## Support

For issues specific to:
- **Expo**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **PayPal**: https://developer.paypal.com

## Differences from Web App

| Feature | Web App | Mobile App |
|---------|---------|------------|
| PDF Generation | jsPDF | expo-print (HTML) |
| File Download | file-saver | expo-sharing |
| Navigation | React Router | React Navigation |
| Components | Radix UI | Custom RN components |
| PayPal | JavaScript SDK | WebView |
| Styling | Tailwind | StyleSheet |
| Date Picker | react-day-picker | Manual input |

## License

MIT - Same as web version
