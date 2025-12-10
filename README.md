# DocuMint - Professional Document Generation

A beautiful web app for generating professional pay stubs and bank statements with PayPal payment integration.

## Features

- 🎨 3 completely different templates for pay stubs
- 🎨 3 completely different templates for bank statements
- 💳 PayPal payment integration ($10 per paystub, $50 per bank statement)
- 📦 ZIP downloads for multiple paystubs
- 📅 Unlimited paystub generation with date range selector
- 🎯 No backend required - runs completely in the browser

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd <repo-name>
```

2. Navigate to frontend and install dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

### Running the App

```bash
npm start
```

The app will open at http://localhost:3000

## Usage

1. **Select Document Type**: Choose Pay Stub or Bank Statement from the home page
2. **Choose Template**: Select from Template A, B, or C (each has a unique design)
3. **Fill Form**: Enter all required employee/company information
4. **Pay with PayPal**: Complete payment securely through PayPal
5. **Download**: Your PDF will automatically download after payment

### Multiple Paystubs
- Set a date range (Start Date → End Date)
- The app calculates the number of stubs based on pay frequency
- Downloads as a ZIP file with all PDFs named by date

## Templates

### Pay Stub Templates
- **Template A**: Classic Professional - Traditional layout with gray accents
- **Template B**: Modern Minimalist - Clean white space with blue theme
- **Template C**: Detailed Corporate - Purple borders with comprehensive tables

### Bank Statement Templates
- **Template A**: Traditional Bank Statement - Green header, classic layout
- **Template B**: Modern Digital Statement - Blue cards with alternating rows
- **Template C**: Professional Corporate - Purple theme with bordered sections

## PayPal Configuration

The app uses PayPal Sandbox for testing. To use your own PayPal account:

1. Get your Client ID from https://developer.paypal.com
2. Update `frontend/.env`:
```
REACT_APP_PAYPAL_CLIENT_ID=your_client_id_here
```

## Technologies

- React
- Tailwind CSS
- shadcn/ui components
- jsPDF (PDF generation)
- JSZip (ZIP file creation)
- PayPal React SDK

## Customization

To customize PDF templates, edit:
- `/frontend/src/utils/paystubTemplates.js` - Pay stub designs
- `/frontend/src/utils/bankStatementTemplates.js` - Bank statement designs

Each template function receives data and can be styled completely differently.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
