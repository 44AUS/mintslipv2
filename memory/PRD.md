# MintSlip Mobile App - Product Requirements Document

## Original Problem Statement
Transform the existing `/mobile` folder from a simple WebView wrapper into a true native mobile application. The app must preserve the MintSlip design system (colors, fonts) but adapt the layout to mobile-native patterns. WebView is forbidden except for document preview. The app should include login/splash screens with signup and guest options, bottom navigation, and maintain feature parity with the web frontend for forms, validation, and backend payloads.

## Target Users
- Small business owners needing professional pay stubs
- Self-employed individuals requiring income documentation
- Contractors needing Canadian pay stubs
- Anyone requiring quick document generation on mobile

## Core Requirements
1. Native mobile UI (React Native/Expo)
2. US and Canadian Paystub generators
3. Live document preview (WebView-based)
4. Stripe payment integration
5. PDF download after payment

## Tech Stack
- **Frontend (Mobile):** React Native, Expo SDK 54
- **Navigation:** React Navigation v7
- **State Management:** React Context API
- **Styling:** StyleSheet API with MintSlip design system
- **Backend:** Existing FastAPI backend (shared with web)
- **Payments:** Stripe

## Architecture
```
/app/mobile/
├── App.js                    # Root component with providers
├── app.json                  # Expo configuration with deep linking
├── package.json              # Dependencies
└── src/
    ├── components/           # Reusable UI components
    │   ├── Button.js
    │   ├── Input.js
    │   ├── Select.js
    │   ├── SectionHeader.js
    │   ├── PaystubPreview.js # WebView-based preview
    │   └── Toast.js
    ├── context/
    │   └── AuthContext.js    # User auth state management
    ├── navigation/
    │   ├── AuthNavigator.js
    │   ├── MainNavigator.js
    │   └── RootNavigator.js  # With deep linking config
    ├── screens/
    │   ├── SplashScreen.js
    │   ├── WelcomeScreen.js
    │   ├── LoginScreen.js
    │   ├── SignupScreen.js
    │   ├── HomeScreen.js
    │   ├── PaystubGeneratorScreen.js
    │   ├── CanadianPaystubGeneratorScreen.js
    │   ├── PaymentSuccessScreen.js  # NEW: Handles post-payment
    │   └── SettingsScreen.js
    ├── services/
    │   └── api.js            # Axios instance for backend
    └── styles/
        └── theme.js          # Design system constants
```

## What's Been Implemented

### Completed (Dec 2025)
- [x] Native app scaffolding with Expo
- [x] Core screens (Splash, Welcome, Login, Signup)
- [x] Authentication context with AsyncStorage
- [x] US Paystub Generator form
- [x] Canadian Paystub Generator form
- [x] WebView-based live document preview (3 templates)
- [x] Stripe checkout session creation
- [x] Bottom tab navigation
- [x] Deep linking configuration
- [x] PaymentSuccessScreen for post-payment flow

### In Progress
- [ ] Full PDF generation and download on mobile
- [ ] Email-based document delivery after payment

### Backlog (P2)
- [ ] Complete signup flow with email verification
- [ ] Subscription plan selection during signup
- [ ] My Documents screen (view/re-download)
- [ ] Global toast system for errors
- [ ] Other document generators

## API Endpoints Used
- `POST /api/user/login` - User authentication
- `POST /api/user/signup` - User registration
- `GET /api/user/me` - Get current user
- `POST /api/stripe/create-one-time-checkout` - Create Stripe session
- `GET /api/stripe/checkout-status/{session_id}` - Verify payment

## Deep Linking
- **Scheme:** `mintslip://`
- **Success URL:** `mintslip://payment-success?session_id=xxx&type=paystub`
- **Web fallback:** `https://ai-blog-image-fix.preview.emergentagent.com/payment-success`

## Known Limitations
1. PDF generation happens on web frontend (jsPDF), not mobile
2. Mobile uses WebView for preview only, actual download redirects to web
3. Signup flow UI exists but lacks backend integration for email verification

## Testing Notes
- Use "Continue as Guest" to test generators without auth
- Payment flow opens Stripe checkout in external browser
- Deep linking requires app rebuild for full testing

## Next Steps (Priority Order)
1. **P1:** Implement backend PDF generation endpoint for mobile
2. **P1:** Complete post-payment download flow with expo-file-system
3. **P2:** Add email verification to signup flow
4. **P2:** Build My Documents screen
