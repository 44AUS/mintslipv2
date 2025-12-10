# 🚀 DocuMint Mobile - Quick Start

## Installation (5 minutes)

```bash
# 1. Navigate to mobile directory
cd /app/mobile

# 2. Install dependencies
npm install
# or
yarn install

# 3. Start the app
npm start
# or
expo start
```

## Run on Your Device (Easiest!)

1. **Install Expo Go** on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR Code** shown in terminal
   - iOS: Use Camera app
   - Android: Use Expo Go app scanner

3. **App loads** on your device!

## Run on Simulator/Emulator

### iOS (Mac only)
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Test the App

### Test Pay Stub Generation:
1. Tap "Pay Stub" card
2. Select "Template A"
3. Fill in:
   - Name: "John Doe"
   - Company: "Acme Corp"
   - Start Date: "2025-01-01"
   - End Date: "2025-01-14"
   - Rate: "25"
4. Tap "Pay with PayPal"
5. Complete sandbox payment
6. PDF generates and share sheet appears!

### Test Bank Statement:
1. Tap "Bank Statement" card
2. Select "Template A"
3. Fill in account details
4. Add a few transactions
5. Tap "Pay $50"
6. Complete payment
7. PDF generates!

## What's Working

✅ All 3 pay stub templates
✅ All 3 bank statement templates
✅ Multiple paystubs with ZIP
✅ PayPal payments
✅ PDF generation
✅ File sharing
✅ Professional UI

## Need Help?

- See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
- See [CONVERSION_SUMMARY.md](./CONVERSION_SUMMARY.md) for technical details
- Expo Docs: https://docs.expo.dev

## Quick Customization

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name"
  }
}
```

### Change PayPal Client ID
Edit `src/components/PayPalWebView.js`:
```javascript
const PAYPAL_CLIENT_ID = 'YOUR_CLIENT_ID';
```

### Change Prices
- Pay Stub: Edit `src/screens/PaystubFormScreen.js` line with `* 10`
- Bank Statement: Edit `src/screens/BankStatementFormScreen.js` `amount={50}`

## Next Steps

1. ✅ Test on your device
2. ✅ Try all templates
3. ✅ Generate multiple paystubs
4. 📱 Add app icons (replace files in `/assets`)
5. 🚀 Build for production (see SETUP_GUIDE.md)

---

**You're all set! Start testing now!** 🎉
