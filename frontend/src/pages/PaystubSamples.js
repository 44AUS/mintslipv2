import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Expand, ArrowRight, FileText, CheckCircle, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { generateTemplateA, generateTemplateB, generateTemplateC } from "@/utils/paystubTemplates";
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Sample data for generating previews - default preview data
const SAMPLE_DATA = {
  // Company Info (template uses 'company', 'companyAddress', etc.)
  company: "MintSlip",
  companyAddress: "123 Financial Way",
  companyCity: "Austin",
  companyState: "TX",
  companyZip: "78701",
  companyPhone: "(512) 555-0100",
  ein: "12-3456789",
  
  // Employee Info (template uses 'name', 'address', 'city', etc.)
  name: "John Doe",
  address: "456 Oak Street",
  city: "Austin",
  state: "TX",
  zip: "78702",
  employeeId: "1234",
  ssn: "1234", // Just last 4 digits - template adds XXX-XX- prefix
  bank: "1234", // Just last 4 digits of bank account
  
  // Pay Info
  payFrequency: "biweekly",
  rate: 25.00,
  hours: 80,
  overtime: 0,
  commission: 0,
  bonus: 0,
  workerType: "employee",
  payType: "hourly",
  annualSalary: 52000,
  
  // Dates
  hireDate: "2023-06-15",
  periodStart: "2024-12-01",
  periodEnd: "2024-12-14",
  payDate: "2024-12-20",
  
  // Tax Info
  federalFilingStatus: "single",
  stateAllowances: "1",
  includeLocalTax: false,
  maritalStatus: "single",
  federalExemptions: "1",
  stateExemptions: "1",
  
  // ADP-specific fields
  companyCode: "MINT01",
  locDept: "100/ADM",
  checkNumber: "1001",
  pageNumber: "1",
  
  // Bank Info (for ADP template)
  bankName: "Mint Bank",
  bankLast4: "1234",
  routingNumber: "021000021",
  accountType: "Checking",
  
  // Workday-specific fields
  positionTitle: "Staff Accountant",
  department: "Finance",
  costCenter: "1000",
  
  // Deductions & Contributions (empty for clean sample)
  deductions: [],
  contributions: [],
  absencePlans: [],
  employerBenefits: [],
};

// Template configurations
const TEMPLATES = [
  {
    id: "template-a",
    name: "Gusto Style",
    description: "Clean, modern paystub design inspired by Gusto payroll. Features a compact layout with clear earnings breakdown, tax withholdings, and YTD totals. Perfect for small to medium businesses.",
    features: ["Modern clean design", "Compact single-page layout", "Clear earnings breakdown", "Employee & employer info sections"],
    generator: generateTemplateA,
    color: "#F4A460", // Orange peachy
  },
  {
    id: "template-b",
    name: "ADP Style",
    description: "Professional enterprise-style paystub matching ADP's Earnings Statement format. Includes detailed tax withholding sections, marital status, and comprehensive deduction breakdowns.",
    features: ["Enterprise professional format", "Detailed tax breakdown", "Marital status & exemptions", "Check stub with bank info"],
    generator: generateTemplateB,
    color: "#d0271d", // ADP red
  },
  {
    id: "template-c",
    name: "Workday Style",
    description: "Corporate HR-focused paystub design inspired by Workday. Features absence plan tracking, employer benefits section, and side-by-side comparison tables for detailed reporting.",
    features: ["Corporate HR style", "Absence plan tracking", "Employer benefits section", "Side-by-side tables"],
    generator: generateTemplateC,
    color: "#0066cc", // Workday blue
  },
];

// Convert PDF to image
async function convertPdfToImage(pdfDataUrl, scale = 1.5) {
  const base64Data = pdfDataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  return canvas.toDataURL('image/png', 0.9);
}

// Generate MintSlip logo as data URL
function generateMintSlipLogo() {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 60;
  const ctx = canvas.getContext('2d');
  
  // Clear background (transparent)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw "MintSlip" text
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#1a4731'; // MintSlip dark green
  ctx.textBaseline = 'middle';
  ctx.fillText('MintSlip', 10, 32);
  
  return canvas.toDataURL('image/png');
}

// Generate sample preview for a template
async function generateSamplePreview(template) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "letter",
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  // Generate MintSlip logo for the preview
  const mintSlipLogo = generateMintSlipLogo();
  
  // Calculate sample values
  const rate = SAMPLE_DATA.rate;
  const hours = SAMPLE_DATA.hours;
  const overtime = SAMPLE_DATA.overtime;
  const regularPay = rate * hours;
  const overtimeRate = rate * 1.5;
  const overtimePay = overtimeRate * overtime;
  const grossPay = regularPay + overtimePay;
  
  // Tax calculations (Texas has no state income tax)
  const ssTax = grossPay * 0.062;
  const medTax = grossPay * 0.0145;
  const federalTax = grossPay * 0.12;
  const stateTax = 0; // Texas - no state tax
  const localTax = 0;
  const totalTax = ssTax + medTax + federalTax + stateTax + localTax;
  const netPay = grossPay - totalTax;
  
  // YTD calculations (assuming 6 pay periods)
  const ytdMultiplier = 6;
  
  // Parse dates
  const startDate = new Date(SAMPLE_DATA.periodStart);
  const endDate = new Date(SAMPLE_DATA.periodEnd);
  const payDate = new Date(SAMPLE_DATA.payDate);
  
  const templateData = {
    formData: {
      ...SAMPLE_DATA,
      // These are already correct in SAMPLE_DATA with proper field names
    },
    rate,
    hours,
    overtime,
    overtimeRate,
    regularPay,
    overtimePay,
    grossPay,
    ssTax,
    medTax,
    federalTax,
    stateTax,
    localTax,
    totalTax,
    netPay,
    // Dates at top level for template
    startDate,
    endDate,
    payDate,
    payFrequency: SAMPLE_DATA.payFrequency,
    stubNum: 1,
    totalStubs: 1,
    // YTD values
    ytdRegularPay: regularPay * ytdMultiplier,
    ytdOvertimePay: overtimePay * ytdMultiplier,
    ytdGrossPay: grossPay * ytdMultiplier,
    ytdSsTax: ssTax * ytdMultiplier,
    ytdMedTax: medTax * ytdMultiplier,
    ytdFederalTax: federalTax * ytdMultiplier,
    ytdStateTax: stateTax * ytdMultiplier,
    ytdLocalTax: 0,
    ytdTotalTax: totalTax * ytdMultiplier,
    ytdNetPay: netPay * ytdMultiplier,
    ytdHours: hours * ytdMultiplier,
    ytdOvertimeHours: overtime * ytdMultiplier,
    ytdCommission: 0,
    ytdBonus: 0,
    ytdPayPeriods: ytdMultiplier,
    commission: 0,
    bonus: 0,
    // Deductions/Contributions
    deductionsData: [],
    contributionsData: [],
    absencePlansData: [],
    employerBenefitsData: [],
    totalDeductions: 0,
    totalContributions: 0,
    preTaxDeductions: 0,
    postTaxDeductions: 0,
    preTaxContributions: 0,
    postTaxContributions: 0,
    totalPreTax: 0,
    totalPostTax: 0,
    ytdDeductions: 0,
    ytdContributions: 0,
    // Pay type info
    payType: SAMPLE_DATA.payType,
    annualSalary: SAMPLE_DATA.annualSalary,
    workerType: SAMPLE_DATA.workerType,
    isContractor: false,
    // Logo
    logoDataUrl: mintSlipLogo,
    // Tax rates
    stateRate: 0,
    localTaxRate: 0,
    sutaRate: 0,
  };
  
  // Generate using the appropriate template
  await template.generator(doc, templateData, pageWidth, pageHeight, margin);
  
  const pdfDataUrl = doc.output('datauristring');
  return await convertPdfToImage(pdfDataUrl, 2);
}

// Template Card Component
function TemplateCard({ template, previewImage, isLoading, onUseTemplate }) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Preview Image */}
      <div className="relative aspect-[8.5/11] bg-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : previewImage ? (
          <>
            <img 
              src={previewImage} 
              alt={`${template.name} preview`}
              className="w-full h-full object-cover object-top"
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-16 h-16 text-slate-300" />
          </div>
        )}
        
        {/* Template name badge */}
        <div 
          className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-white text-sm font-semibold shadow-lg"
          style={{ backgroundColor: template.color }}
        >
          {template.name}
        </div>
        
        {/* Expand button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button 
              className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
              disabled={isLoading || !previewImage}
            >
              <Expand className="w-4 h-4 text-slate-700" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: template.color }}
                />
                {template.name} Preview
              </DialogTitle>
            </DialogHeader>
            {previewImage && (
              <div className="mt-4">
                <img 
                  src={previewImage} 
                  alt={`${template.name} full preview`}
                  className="w-full rounded-lg border border-slate-200 shadow-lg"
                />
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => {
                  setDialogOpen(false);
                  onUseTemplate(template.id);
                }}
                className="bg-green-700 hover:bg-green-800"
              >
                Use This Template
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Card Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {template.name}
        </h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {template.description}
        </p>
        
        {/* Features list */}
        <ul className="space-y-1.5 mb-5">
          {template.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        
        {/* Action Button */}
        <Button 
          onClick={() => onUseTemplate(template.id)}
          className="w-full bg-green-700 hover:bg-green-800 text-white"
        >
          Use This Template
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default function PaystubSamples() {
  const navigate = useNavigate();
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState({});
  
  // Generate previews on mount
  useEffect(() => {
    const generateAllPreviews = async () => {
      for (const template of TEMPLATES) {
        setLoading(prev => ({ ...prev, [template.id]: true }));
        try {
          const preview = await generateSamplePreview(template);
          setPreviews(prev => ({ ...prev, [template.id]: preview }));
        } catch (error) {
          console.error(`Error generating preview for ${template.name}:`, error);
        }
        setLoading(prev => ({ ...prev, [template.id]: false }));
      }
    };
    
    generateAllPreviews();
  }, []);
  
  const handleUseTemplate = (templateId) => {
    // Navigate to paystub form with template pre-selected
    navigate(`/paystub-generator?template=${templateId}`);
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
              <FileText className="w-4 h-4" />
              Professional Paystub Templates
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Paystub Sample Templates
            </h1>
            <p className="text-lg sm:text-xl text-green-100 max-w-3xl mx-auto mb-8">
              Choose from our professionally designed paystub templates. Each template is crafted to meet industry standards and provides a clean, professional appearance for your payroll documents.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => navigate('/paystub-generator')}
                size="lg"
                className="bg-white text-green-900 hover:bg-green-50 font-semibold px-8"
              >
                Create Your Paystub
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Templates Grid */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Our Paystub Templates
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select any template below to see a full preview or start creating your paystub right away. All templates include accurate tax calculations and professional formatting.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                previewImage={previews[template.id]}
                isLoading={loading[template.id]}
                onUseTemplate={handleUseTemplate}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Why Choose Our Templates?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our paystub generator provides professional, accurate documents trusted by thousands of businesses.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Accurate Calculations</h3>
              <p className="text-slate-600">
                All federal, state, and local taxes are automatically calculated based on current tax rates.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Professional Design</h3>
              <p className="text-slate-600">
                Templates designed to match industry-standard payroll formats from leading providers.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-7 h-7 text-green-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Instant Download</h3>
              <p className="text-slate-600">
                Generate and download your paystub PDF instantly after completing your information.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-green-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Ready to Create Your Paystub?
          </h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Choose any template above and start generating professional paystubs in minutes. No complicated setup required.
          </p>
          <Button 
            onClick={() => navigate('/paystub-generator')}
            size="lg"
            className="bg-white text-green-900 hover:bg-green-50 font-semibold px-8"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
