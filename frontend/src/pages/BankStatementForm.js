import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Plus, Trash2, ArrowLeft, Upload, X, Search, Building2 , CreditCard, Lock, Loader2, Sparkles, MapPin, Briefcase, DollarSign } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createStripeCheckout } from "@/utils/stripePayment";
import CouponInput from "@/components/CouponInput";
import { generateAndDownloadBankStatement } from "@/utils/bankStatementGenerator";
import { generateBankStatementPreview } from "@/utils/bankStatementPreviewGenerator";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { formatAccountNumber, validateAccountNumber } from "@/utils/validation";
import ChimeLogo from '../assests/chime.png';
import BoA from '../assests/boa2.png';
import ChaseLogo from '../assests/chase-logo-black-transparent.png';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

// US States with major cities for AI transaction generator
const US_STATES = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "FL": "Florida", "GA": "Georgia",
  "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa",
  "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
  "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri",
  "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey",
  "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio",
  "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
  "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
  "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming",
  "DC": "District of Columbia"
};

const US_CITIES_BY_STATE = {
  "AL": ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],
  "AK": ["Anchorage", "Fairbanks", "Juneau", "Sitka"],
  "AZ": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Gilbert", "Glendale", "Tempe"],
  "AR": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale"],
  "CA": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno", "Oakland", "Long Beach"],
  "CO": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder"],
  "CT": ["Bridgeport", "New Haven", "Hartford", "Stamford"],
  "DE": ["Wilmington", "Dover", "Newark", "Middletown"],
  "FL": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "St Petersburg", "Tallahassee"],
  "GA": ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Marietta", "Roswell"],
  "HI": ["Honolulu", "Pearl City", "Hilo", "Kailua"],
  "ID": ["Boise", "Meridian", "Nampa", "Idaho Falls"],
  "IL": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield"],
  "IN": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend"],
  "IA": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City"],
  "KS": ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
  "KY": ["Louisville", "Lexington", "Bowling Green", "Owensboro"],
  "LA": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  "ME": ["Portland", "Lewiston", "Bangor", "Auburn"],
  "MD": ["Baltimore", "Frederick", "Rockville", "Gaithersburg"],
  "MA": ["Boston", "Worcester", "Springfield", "Cambridge"],
  "MI": ["Detroit", "Grand Rapids", "Warren", "Ann Arbor", "Lansing"],
  "MN": ["Minneapolis", "Saint Paul", "Rochester", "Duluth"],
  "MS": ["Jackson", "Gulfport", "Southaven", "Hattiesburg"],
  "MO": ["Kansas City", "Saint Louis", "Springfield", "Columbia"],
  "MT": ["Billings", "Missoula", "Great Falls", "Bozeman"],
  "NE": ["Omaha", "Lincoln", "Bellevue", "Grand Island"],
  "NV": ["Las Vegas", "Henderson", "Reno", "North Las Vegas"],
  "NH": ["Manchester", "Nashua", "Concord", "Dover"],
  "NJ": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Trenton"],
  "NM": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe"],
  "NY": ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"],
  "NC": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Fayetteville"],
  "ND": ["Fargo", "Bismarck", "Grand Forks", "Minot"],
  "OH": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
  "OK": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow"],
  "OR": ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro"],
  "PA": ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Erie"],
  "RI": ["Providence", "Warwick", "Cranston", "Pawtucket"],
  "SC": ["Charleston", "Columbia", "North Charleston", "Greenville"],
  "SD": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings"],
  "TN": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Murfreesboro"],
  "TX": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Plano"],
  "UT": ["Salt Lake City", "West Valley City", "Provo", "West Jordan"],
  "VT": ["Burlington", "South Burlington", "Rutland", "Montpelier"],
  "VA": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Arlington"],
  "WA": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
  "WV": ["Charleston", "Huntington", "Morgantown", "Parkersburg"],
  "WI": ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
  "WY": ["Cheyenne", "Casper", "Laramie", "Gillette"],
  "DC": ["Washington"]
};

// Transaction categories for AI generator
const TRANSACTION_CATEGORIES = [
  { id: "groceries", label: "Groceries", icon: "🛒" },
  { id: "gas_auto", label: "Gas & Auto", icon: "⛽" },
  { id: "dining", label: "Dining", icon: "🍔" },
  { id: "retail", label: "Retail", icon: "🛍️" },
  { id: "utilities", label: "Utilities", icon: "💡" },
  { id: "subscriptions", label: "Subscriptions", icon: "📺" },
  { id: "atm_withdrawal", label: "ATM Withdrawal", icon: "🏧" },
  { id: "fees", label: "Fees", icon: "💳" },
  { id: "misc", label: "Misc", icon: "📦" },
  { id: "credits_deposit", label: "Direct Deposit", icon: "💰" },
  { id: "credits_p2p", label: "P2P Credits", icon: "📲" },
  { id: "credits_refunds", label: "Refunds", icon: "↩️" },
];

// Check if running on localhost for development features
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Accounting Mockup templates - user will supply logos
// Logo placeholders - replace these paths with actual logo files when provided
// Template B (Bank of America) and Template C (Chase) are only available on localhost during development
const BANKS_DATA = [
  { id: 'chime', name: 'Chime', logo: ChimeLogo, template: 'template-a' },
  // Template B and C are hidden in production - uncomment below lines when ready to go live:
  // { id: 'bank-of-america', name: 'Bank of America', logo: BoA, template: 'template-b' },
  // { id: 'chase', name: 'Chase', logo: ChaseLogo, template: 'template-c' },
  ...(isLocalhost ? [
    { id: 'bank-of-america', name: 'Bank of America', logo: BoA, template: 'template-b' },
    { id: 'chase', name: 'Chase', logo: ChaseLogo, template: 'template-c' },
  ] : []),
];

export default function BankStatementForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("template-a"); // Default to Chime which is always available
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // User subscription state
  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
  
  // Check user subscription on mount
  useEffect(() => {
    checkUserSubscription();
  }, []);
  
  const checkUserSubscription = async () => {
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");
    
    if (token && userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        setUser(userData);
        
        if (userData.subscription && 
            userData.subscription.status === "active" &&
            (userData.subscription.downloads_remaining > 0 || userData.subscription.downloads_remaining === -1)) {
          setHasActiveSubscription(true);
        }
        
        const response = await fetch(`${BACKEND_URL}/api/user/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("userInfo", JSON.stringify(data.user));
            
            if (data.user.subscription && 
                data.user.subscription.status === "active" &&
                (data.user.subscription.downloads_remaining > 0 || data.user.subscription.downloads_remaining === -1)) {
              setHasActiveSubscription(true);
            } else {
              setHasActiveSubscription(false);
            }
          }
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    }
  };
  
  // Category search state
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const bankSearchRef = useRef(null);
  
  // Logo upload state
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [logoError, setLogoError] = useState("");
  const fileInputRef = useRef(null);
  
  const [accountName, setAccountName] = useState("");
  const [accountAddress1, setAccountAddress1] = useState("");
  const [accountAddress2, setAccountAddress2] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [beginningBalance, setBeginningBalance] = useState("0.00");
  const [transactions, setTransactions] = useState([
    { date: "", description: "", type: "Purchase", amount: "" },
  ]);

  // AI Transaction Generator state
  const [aiGenState, setAiGenState] = useState("");
  const [aiGenCities, setAiGenCities] = useState([]);
  const [aiGenVolume, setAiGenVolume] = useState("moderate");
  const [aiGenCategories, setAiGenCategories] = useState(["groceries", "gas_auto", "dining", "retail"]);
  const [aiGenEmployerName, setAiGenEmployerName] = useState("");
  const [aiGenPayFrequency, setAiGenPayFrequency] = useState("biweekly");
  const [aiGenDepositAmount, setAiGenDepositAmount] = useState("");
  const [isGeneratingTransactions, setIsGeneratingTransactions] = useState(false);

  // For parsed address components
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    accountNumber: '',
  });

  // Filter banks based on search query
  const filteredBanks = BANKS_DATA.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  // Handle category selection - only changes template, user must still upload logo
  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setBankSearchQuery(bank.name);
    setSelectedTemplate(bank.template);
    setShowBankDropdown(false);
    // Note: We do NOT auto-populate the logo - user must upload their own
  };

  // Handle custom category name for "Other"
  const handleCustomBankName = (e) => {
    setCustomBankName(e.target.value);
  };

  // Resize image to fit within target dimensions while maintaining aspect ratio
  const resizeImageToFit = (base64Data, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate scaling factor to fit within bounds
        const scaleW = maxWidth / img.width;
        const scaleH = maxHeight / img.height;
        const scale = Math.min(scaleW, scaleH, 1); // Don't upscale if smaller
        
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        // Enable smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to PNG base64
        const resizedBase64 = canvas.toDataURL('image/png');
        resolve(resizedBase64);
      };
      img.onerror = () => reject(new Error('Failed to load image for resizing'));
      img.src = base64Data;
    });
  };

  // Logo upload validation and processing
  const validateAndProcessLogo = async (file) => {
    setLogoError("");
    
    // Check file type - accept PNG and JPG
    if (!file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg')) {
      setLogoError("Only PNG or JPG files are accepted");
      return false;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("File size must be under 2MB");
      return false;
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64 = e.target.result;
          
          // Resize to fit Chime logo dimensions (65x20 PDF units ≈ 195x60 pixels at 3x scale)
          const resizedBase64 = await resizeImageToFit(base64, 195, 60);
          
          localStorage.setItem('bankStatementLogo', resizedBase64);
          setUploadedLogo(resizedBase64);
          setLogoPreview(resizedBase64);
          resolve(true);
        } catch (err) {
          console.error('Error processing logo:', err);
          setLogoError("Error processing image");
          resolve(false);
        }
      };
      reader.onerror = () => {
        setLogoError("Error reading file");
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file drop
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await validateAndProcessLogo(files[0]);
    }
  };

  // Handle file select
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await validateAndProcessLogo(files[0]);
    }
  };

  // Remove uploaded logo
  const removeLogo = () => {
    setUploadedLogo(null);
    setLogoPreview(null);
    localStorage.removeItem('bankStatementLogo');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear any previously saved logo on mount (fresh start each time)
  useEffect(() => {
    localStorage.removeItem('bankStatementLogo');
    setUploadedLogo(null);
    setLogoPreview(null);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bankSearchRef.current && !bankSearchRef.current.contains(event.target)) {
        setShowBankDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validated input handler
  const handleAccountNumberChange = (e) => {
    const formatted = formatAccountNumber(e.target.value);
    setAccountNumber(formatted);
    const validation = validateAccountNumber(formatted);
    setValidationErrors(prev => ({ ...prev, accountNumber: validation.error }));
  };

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${y}-${m}`);
  }, []);

  // Handle address selection from Google Places
  const handleAddressSelect = useCallback((addressData) => {
    setAccountAddress1(addressData.address);
    setAddressCity(addressData.city);
    setAddressState(addressData.state);
    setAddressZip(addressData.zip);
    // Auto-fill address line 2 with city, state, zip
    setAccountAddress2(`${addressData.city}, ${addressData.state} ${addressData.zip}`);
  }, []);

  // Generate PDF preview when form data changes (debounced)
  // Only generate when a bank/template is selected
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only generate preview if a category is selected AND we have minimum required data
      if (selectedBank && selectedMonth) {
        setIsGeneratingPreview(true);
        try {
          const formData = {
            accountName,
            accountAddress1,
            accountAddress2,
            accountNumber,
            selectedMonth,
            beginningBalance,
            transactions,
            bankName: selectedBank?.name || '',
            bankLogo: uploadedLogo
          };
          const previewUrl = await generateBankStatementPreview(formData, selectedTemplate);
          setPdfPreview(previewUrl);
        } catch (error) {
          console.error("Preview generation failed:", error);
        }
        setIsGeneratingPreview(false);
      } else {
        // Clear preview if no category selected
        setPdfPreview(null);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [accountName, accountAddress1, accountAddress2, accountNumber, selectedMonth, beginningBalance, transactions, selectedTemplate, selectedBank, uploadedLogo]);

  const addTransaction = () => {
    setTransactions([...transactions, { date: "", description: "", type: "Purchase", amount: "" }]);
  };

  const removeTransaction = (idx) => {
    setTransactions(transactions.filter((_, i) => i !== idx));
  };

  const updateTransaction = (idx, field, value) => {
    const updated = [...transactions];
    updated[idx][field] = value;
    setTransactions(updated);
  };

// Get price based on selected template
const getStatementPrice = () => {
  // BOA (template-b) and Chase (template-c) are $70
  if (selectedTemplate === 'template-b' || selectedTemplate === 'template-c') {
    return 69.99;
  }
  // Chime (template-a) and others are $50
  return 49.99;
};

const createOrder = (data, actions) => {
  const basePrice = getStatementPrice();
  const finalPrice = appliedDiscount ? appliedDiscount.discountedPrice : basePrice;
  return actions.order.create({
    application_context: {
      shipping_preference: "NO_SHIPPING", // Digital product - no shipping required
    },
    purchase_units: [
      {
        amount: {
          value: finalPrice.toFixed(2),
          currency_code: "USD",
        },
        description: `Accounting Mockup Generation${appliedDiscount ? ` (${appliedDiscount.discountPercent}% OFF)` : ''}`,
      },
    ],
  });
};

  // Handle subscription-based download
  const handleSubscriptionDownload = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      toast.error("Please log in to use your subscription");
      navigate("/login");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/subscription-download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentType: "bank-statement",
          template: selectedTemplate
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to process subscription download");
      }
      
      // Generate and download PDF
      const formDataToSend = {
        accountName,
        accountAddress1,
        accountAddress2,
        accountNumber,
        selectedMonth,
        beginningBalance,
        transactions,
        bankName: selectedBank?.id === 'other' ? customBankName : (selectedBank?.name || ''),
        bankLogo: uploadedLogo
      };
      
      // Check if user wants documents saved
      const shouldSave = user?.preferences?.saveDocuments;
      
      const pdfBlob = await generateAndDownloadBankStatement(formDataToSend, selectedTemplate, shouldSave);
      
      // Save document if user has preference enabled and blob was returned
      if (shouldSave && pdfBlob && pdfBlob instanceof Blob) {
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            const fileName = `BankStatement_${accountName || 'statement'}_${selectedMonth}.pdf`;
            
            await fetch(`${BACKEND_URL}/api/user/saved-documents`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                documentType: "bank-statement",
                fileName: fileName,
                fileData: base64Data,
                template: selectedTemplate
              })
            });
            toast.success("Document saved to your account!");
          };
          reader.readAsDataURL(pdfBlob);
        } catch (saveError) {
          console.error("Failed to save document:", saveError);
        }
      }
      
      if (data.downloadsRemaining !== undefined) {
        const updatedUser = { ...user };
        if (updatedUser.subscription) {
          updatedUser.subscription.downloads_remaining = data.downloadsRemaining;
        }
        setUser(updatedUser);
        localStorage.setItem("userInfo", JSON.stringify(updatedUser));
        
        if (data.downloadsRemaining === 0) {
          setHasActiveSubscription(false);
        }
      }
      
      // Clear the uploaded logo
      localStorage.removeItem('bankStatementLogo');
      setUploadedLogo(null);
      setLogoPreview(null);
      
      toast.success("Bank statement downloaded successfully!");
      navigate("/user/downloads");
      
    } catch (error) {
      console.error("Subscription download error:", error);
      toast.error(error.message || "Failed to download. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };


  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      const orderData = await actions.order.capture();
      const orderId = orderData.id || `BS-${Date.now()}`;
      const payerEmail = orderData?.payer?.email_address || "";
      toast.success("Payment successful! Generating your document...");
      
      // Track purchase
      const totalAmount = appliedDiscount ? appliedDiscount.discountedPrice : getStatementPrice();
      try {
        await fetch(`${BACKEND_URL}/api/purchases/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: "bank-statement",
            amount: totalAmount,
            paypalEmail: payerEmail,
            paypalTransactionId: orderId,
            discountCode: appliedDiscount?.code || null,
            discountAmount: appliedDiscount ? getStatementPrice() - appliedDiscount.discountedPrice : 0,
            template: selectedTemplate
          })
        });
      } catch (trackError) {
        console.error("Failed to track purchase:", trackError);
      }
      
      // Generate and download PDF
      const formData = {
        accountName,
        accountAddress1,
        accountAddress2,
        accountNumber,
        selectedMonth,
        beginningBalance,
        transactions,
        bankName: selectedBank?.id === 'other' ? customBankName : (selectedBank?.name || ''),
        bankLogo: uploadedLogo
      };
      await generateAndDownloadBankStatement(formData, selectedTemplate);
      
      // Clear the uploaded logo from localStorage after successful download
      localStorage.removeItem('bankStatementLogo');
      setUploadedLogo(null);
      setLogoPreview(null);
      
      toast.success("Accounting mockup downloaded successfully!");
      setIsProcessing(false);
      
      // Redirect to payment success page
      navigate(`/payment-success?type=bank-statement&order_id=${orderId}&count=1`);
    } catch (error) {
      toast.error("Failed to generate document");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    setIsProcessing(false);
  };

  // Handle Stripe checkout for Bank Statement payment
  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    
    try {
      const basePrice = getStatementPrice();
      const finalAmount = appliedDiscount ? appliedDiscount.discountedPrice : basePrice;
      
      // Build form data object with all form field values
      const formDataToStore = {
        accountName,
        accountAddress1,
        accountAddress2,
        accountNumber,
        selectedMonth,
        beginningBalance,
        transactions,
        bankName: selectedBank?.name || '',
        bankLogo: uploadedLogo
      };
      
      // Store form data for after payment
      localStorage.setItem("pendingBankStatementData", JSON.stringify({
        formData: formDataToStore,
        transactions,
        bankLogo: uploadedLogo,
        beginningBalance,
        statementPeriod: selectedMonth
      }));
      localStorage.setItem("pendingBankStatementTemplate", selectedTemplate);
      
      const { url } = await createStripeCheckout({
        amount: finalAmount,
        documentType: "bank-statement",
        template: selectedTemplate,
        appliedDiscount,
        successPath: "/payment-success",
        cancelPath: "/accounting-mockup-generator"
      });
      
      window.location.href = url;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clear logo from localStorage when leaving the page
  useEffect(() => {
    return () => {
      localStorage.removeItem('bankStatementLogo');
    };
  }, []);

  // Calculate ending balance for preview
  const calculateEndingBalance = () => {
    const beginning = parseFloat(beginningBalance) || 0;
    let balance = beginning;
    
    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount) || 0;
      if (tx.type === "Deposit" || tx.type === "Refund") {
        balance += amount;
      } else {
        balance -= amount;
      }
    });
    
    return balance;
  };

  // Check if form is valid for payment
  const isFormValid = () => {
    return selectedBank && uploadedLogo && accountName && accountNumber;
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Helmet>
        <title>Accounting Mockup Generator | MintSlip - Create Accounting Mockups</title>
        <meta name="description" content="Generate professional Accounting Mockup mockups for personal budgeting and financial planning. Multiple styles available. Instant PDF download." />
        <meta name="keywords" content="Accounting Mockup generator, accounting mockup, financial statement, budget planning" />
        <meta property="og:title" content="Accounting Mockup Generator | MintSlip" />
        <meta property="og:description" content="Create professional Accounting Mockup mockups for budgeting purposes." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Accounting Mockup Generator | MintSlip" />
        <meta name="twitter:description" content="Professional accounting mockup generator for personal finance." />
      </Helmet>
      
      <div className="noise-overlay" />
      
      <Header title="Generate Accounting Mockup" />

      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Instant Accounting Mockups Generator
          </h1>
          <p className="text-slate-600">Generate statement templates for personal bookkeeping and organizational purposes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              {/* Category Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Select Your Category
                </h2>
                
                {/* Category Search Input */}
                <div className="relative" ref={bankSearchRef}>
                  <Label htmlFor="bankSearch">Template Title *</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="bankSearch"
                      data-testid="bank-search-input"
                      value={bankSearchQuery}
                      onChange={(e) => {
                        setBankSearchQuery(e.target.value);
                        setShowBankDropdown(true);
                        if (selectedBank && e.target.value !== selectedBank.name) {
                          setSelectedBank(null);
                        }
                      }}
                      onFocus={() => setShowBankDropdown(true)}
                      placeholder="Type to search for your category..."
                      className="pl-10 pr-10"
                      required
                    />
                    {selectedBank && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Dropdown */}
                  {showBankDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank) => (
                          <div
                            key={bank.id}
                            data-testid={`bank-option-${bank.id}`}
                            onClick={() => handleBankSelect(bank)}
                            className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors ${
                              selectedBank?.id === bank.id ? 'bg-green-100' : ''
                            }`}
                          >
                            {/* Logo placeholder - 40x40 in dropdown */}
                            {bank.logo ? (
                              <img 
                                src={bank.logo} 
                                alt={bank.name} 
                                className="w-10 h-10 rounded object-contain bg-white border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-slate-700 block">{bank.name}</span>
                              <span className="text-xs text-slate-500">
                                {bank.template === 'template-a' ? 'Chime Inspired Summary Template' : bank.template === 'template-b' ? 'Style B' : 'Style C'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500 text-center">
                          No categories found matching your search.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Category Confirmation */}
                {selectedBank && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      {/* Logo preview - 150x150 */}
                      {selectedBank.logo ? (
                        <img 
                          src={selectedBank.logo} 
                          alt={selectedBank.name} 
                          className="w-[150px] h-[150px] rounded-lg object-contain bg-white border border-slate-200 p-2"
                        />
                      ) : (
                        <div className="w-[150px] h-[150px] rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">✓ Category Selected</p>
                        <p className="font-bold text-xl text-slate-800">{selectedBank.name}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Template: <span className="font-semibold">{selectedBank.template === 'template-a' ? 'Chime Inspired Summary Template' : selectedBank.template === 'template-b' ? 'Style B (Bank of America)' : 'Style C (Chase)'}</span>
                        </p>
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-xs text-amber-700">
                            ⚠️ You must upload your own logo below to generate the statement.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Logo Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                      Category Logo *
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Upload a custom logo. PNG or JPG, max 2MB. Recommended size: 195×60 pixels for best results.
                    </p>
                  </div>
                </div>
                
                {/* Logo Upload Area */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                    isDragging 
                      ? 'border-green-500 bg-green-50' 
                      : logoError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-slate-300 hover:border-green-400'
                  }`}
                >
                  {logoPreview ? (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white p-2"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-700">Logo uploaded successfully!</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click the X to remove and upload a different logo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm text-slate-600 mb-2">
                        Drag and drop your logo here, or
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Select File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                        onChange={handleFileSelect}
                        className="hidden"
                        data-testid="logo-file-input"
                      />
                      <p className="text-xs text-slate-400 mt-3">
                        PNG or JPG, max 2MB • Best: 195×60px
                      </p>
                    </div>
                  )}
                </div>
                
                {logoError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {logoError}
                  </p>
                )}
                
                {!uploadedLogo && !logoError && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    * A logo is required to generate your statement
                  </p>
                )}
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Account Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Holder Name *</Label>
                    <Input data-testid="account-name-input" id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input 
                      data-testid="account-number-input" 
                      id="accountNumber" 
                      value={accountNumber} 
                      onChange={handleAccountNumberChange}
                      placeholder="Enter account number"
                      className={validationErrors.accountNumber ? 'border-red-500' : ''}
                      required 
                    />
                    {validationErrors.accountNumber && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.accountNumber}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="accountAddress1">Address Line 1 (Street Number & Name) *</Label>
                    <Input data-testid="account-address-input" id="accountAddress1" value={accountAddress1} onChange={(e) => setAccountAddress1(e.target.value)} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="accountAddress2">Address Line 2 (City, State ZIP) *</Label>
                    <Input data-testid="account-address-input" id="accountAddress2" value={accountAddress2} onChange={(e) => setAccountAddress2(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selectedMonth">Statement Month *</Label>
                    <Input data-testid="statement-month-input" id="selectedMonth" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beginningBalance">Beginning Balance ($) *</Label>
                    <Input data-testid="beginning-balance-input" id="beginningBalance" type="number" step="0.01" value={beginningBalance} onChange={(e) => setBeginningBalance(e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    Transactions
                  </h2>
                  <Button
                    data-testid="add-transaction-button"
                    type="button"
                    onClick={addTransaction}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Transaction
                  </Button>
                </div>
                <div className="space-y-4">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="p-4 border-2 border-slate-200 rounded-md space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Transaction {idx + 1}</span>
                        {transactions.length > 1 && (
                          <Button
                            data-testid={`remove-transaction-${idx}-button`}
                            type="button"
                            onClick={() => removeTransaction(idx)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Date</Label>
                          <Input
                            data-testid={`transaction-${idx}-date`}
                            type="date"
                            value={tx.date}
                            onChange={(e) => updateTransaction(idx, "date", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Statement Descriptior</Label>
                          <Input
                            data-testid={`transaction-${idx}-description`}
                            value={tx.description}
                            onChange={(e) => updateTransaction(idx, "description", e.target.value)}
                            placeholder="e.g., Amazon Purchase"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select value={tx.type} onValueChange={(val) => updateTransaction(idx, "type", val)}>
                            <SelectTrigger data-testid={`transaction-${idx}-type`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Purchase">Purchase</SelectItem>
                              <SelectItem value="Deposit">Deposit</SelectItem>
                              <SelectItem value="Transfer">Transfer</SelectItem>
                              <SelectItem value="Refund">Refund</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Amount ($)</Label>
                          <Input
                            data-testid={`transaction-${idx}-amount`}
                            type="number"
                            step="0.01"
                            value={tx.amount}
                            onChange={(e) => updateTransaction(idx, "amount", e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Right: Preview and PayPal */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {/* Statement Preview */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Statement Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700 font-semibold">Bank:</span>
                    <span className="font-bold">{selectedBank?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-green-300">
                    <span className="text-slate-700 font-semibold">Account Holder:</span>
                    <span className="font-bold">{accountName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Account Number:</span>
                    <span className="font-medium">{accountNumber ? `****${accountNumber.slice(-4)}` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Statement Period:</span>
                    <span className="font-medium">{selectedMonth || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Transactions:</span>
                    <span className="font-medium">{transactions.filter(t => t.date && t.amount).length}</span>
                  </div>
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-700">Beginning Balance:</span>
                      <span className="font-bold">${parseFloat(beginningBalance || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-700 text-lg mt-2">
                      <span className="font-bold">Ending Balance:</span>
                      <span className="font-bold">${calculateEndingBalance().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Preview Section */}
              <div className="p-4 bg-white border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Document Preview
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Click to enlarge • Watermark removed after payment
                </p>
                
                {isGeneratingPreview ? (
                  <div className="flex items-center justify-center h-96 bg-slate-100 rounded-md">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto mb-2"></div>
                      <p className="text-sm text-slate-500">Generating preview...</p>
                    </div>
                  </div>
                ) : pdfPreview ? (
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="relative cursor-pointer group">
                        {/* PDF Preview Thumbnail */}
                        <div className="relative overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <img 
                            src={pdfPreview}
                            alt="Accounting Mockup Preview"
                            className="w-full h-96 object-contain bg-white"
                          />
                          {/* Watermark Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div 
                              className="text-4xl font-bold text-slate-300 opacity-60 rotate-[-30deg] select-none"
                              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
                            >
                              MintSlip
                            </div>
                          </div>
                          {/* Click to enlarge overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-3 py-1 rounded-full shadow-md">
                              <span className="text-sm text-slate-700 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                                Click to enlarge
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
                      <DialogHeader className="p-4 border-b">
                        <DialogTitle className="flex items-center justify-between">
                          <span>Document Preview</span>
                          <span className="text-sm font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            Watermark removed after payment
                          </span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="relative flex-1 h-full overflow-auto p-4">
                        <img
                          src={pdfPreview}
                          alt="Accounting Mockup Preview Full"
                          className="w-full h-auto"
                        />
                        {/* Large Watermark Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div 
                            className="text-8xl font-bold text-slate-300 opacity-40 rotate-[-30deg] select-none"
                            style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.1)' }}
                          >
                            MintSlip
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="flex items-center justify-center h-96 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
                    <div className="text-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-slate-500">
                        Select a template<br />to see a preview
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* PayPal - Right Side */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  {hasActiveSubscription ? 'Download Document' : 'Complete Payment'}
                </h3>
                <p className="text-xs text-slate-500 mb-4 text-center">
                  By proceeding, you agree that these are accounting mockups for lawful record-keeping and personal organization only.
                </p>
                <p className="text-xs text-slate-500 mb-4 text-center">
                  MintSlip does not provide "official" documents, verify employment, or guarantee acceptance by any third party.
                </p>
                
                {hasActiveSubscription ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Subscription Active</span>
                      </div>
                      <p className="text-sm text-green-600">
                        Downloads remaining: {user?.subscription?.downloads_remaining === -1 ? 'Unlimited' : user?.subscription?.downloads_remaining}
                      </p>
                    </div>
                    
                    {!isFormValid() && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          Please complete the following before download:
                        </p>
                        <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                          {!selectedBank && <li>Select a category</li>}
                          {!uploadedLogo && <li>Upload a logo</li>}
                          {!accountName && <li>Enter account holder name</li>}
                          {!accountNumber && <li>Enter account number</li>}
                        </ul>
                      </div>
                    )}
                    
                    <Button
                      onClick={handleSubscriptionDownload}
                      disabled={isProcessing || !isFormValid()}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Statement (Included in Plan)
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <CouponInput
                      generatorType="bank-statement"
                      originalPrice={getStatementPrice()}
                      onDiscountApplied={setAppliedDiscount}
                    />
                    
                    <p className="text-sm text-slate-600 mb-4">
                      Total: <strong>${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : getStatementPrice().toFixed(2)}</strong>
                      {appliedDiscount && <span className="text-green-600 ml-1">({appliedDiscount.discountPercent}% off)</span>}
                      {!appliedDiscount && ' for accounting mockup generation'}
                    </p>
                    
                    {!isFormValid() && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-700">
                          Please complete the following before payment:
                        </p>
                        <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                          {!selectedBank && <li>Select a category</li>}
                          {!uploadedLogo && <li>Upload a logo</li>}
                          {!accountName && <li>Enter account holder name</li>}
                          {!accountNumber && <li>Enter account number</li>}
                        </ul>
                      </div>
                    )}
                    
                    <div data-testid="paypal-button-container-bank" className={!isFormValid() ? 'opacity-50 pointer-events-none' : ''}>
                      <Button
                        onClick={handleStripeCheckout}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            Pay ${appliedDiscount ? appliedDiscount.discountedPrice.toFixed(2) : '49.99'}
                          </>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
                        <Lock className="w-3 h-3" />
                        <span>Secured by Stripe</span>
                      </div>
                    </div>
                    
                    {/* Subscription upsell */}
                    <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                      <p className="text-sm text-slate-500 mb-2">Save with a subscription plan</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/pricing")}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        View Subscription Plans
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
