import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Upload, X, Search, Building2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadBankStatement } from "@/utils/bankStatementGenerator";
import { generateBankStatementPreview } from "@/utils/bankStatementPreviewGenerator";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { formatAccountNumber, validateAccountNumber } from "@/utils/validation";

// Bank templates - user will supply logos
// Logo placeholders - replace these paths with actual logo files when provided
const BANKS_DATA = [
  { id: 'chime', name: 'Chime', logo: null, template: 'template-a' },
  { id: 'bank-of-america', name: 'Bank of America', logo: null, template: 'template-b' },
  { id: 'chase', name: 'Chase', logo: null, template: 'template-c' },
];

export default function BankStatementForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("template-b");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Bank search state
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

  // Handle bank selection - only changes template, user must still upload logo
  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setBankSearchQuery(bank.name);
    setSelectedTemplate(bank.template);
    setShowBankDropdown(false);
    // Note: We do NOT auto-populate the logo - user must upload their own
  };

  // Handle custom bank name for "Other Bank"
  const handleCustomBankName = (e) => {
    setCustomBankName(e.target.value);
  };

  // Logo upload validation and processing
  const validateAndProcessLogo = (file) => {
    setLogoError("");
    
    // Check file type
    if (!file.type.includes('png')) {
      setLogoError("Only PNG files are accepted");
      return false;
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Store in localStorage
        const base64 = e.target.result;
        localStorage.setItem('bankStatementLogo', base64);
        setUploadedLogo(base64);
        setLogoPreview(base64);
        resolve(true);
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

  // Load logo from localStorage on mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('bankStatementLogo');
    if (savedLogo) {
      setUploadedLogo(savedLogo);
      setLogoPreview(savedLogo);
    }
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
      // Only generate preview if a bank is selected AND we have minimum required data
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
        // Clear preview if no bank selected
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

const createOrder = (data, actions) => {
  return actions.order.create({
    application_context: {
      shipping_preference: "GET_FROM_FILE", 
    },
    purchase_units: [
      {
        amount: {
          value: "50.00",
          currency_code: "USD",
        },
        description: "Bank Statement Generation",
      },
      
    ],
  });
};


  const onApprove = async (data, actions) => {
    setIsProcessing(true);
    try {
      await actions.order.capture();
      toast.success("Payment successful! Generating your document...");
      
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
      
      toast.success("Bank statement downloaded successfully!");
      setIsProcessing(false);
    } catch (error) {
      toast.error("Failed to generate document");
      setIsProcessing(false);
    }
  };

  const onError = (err) => {
    toast.error("Payment failed. Please try again.");
    setIsProcessing(false);
  };

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
    <div className="min-h-screen bg-white relative">
      <div className="noise-overlay" />
      
      <Header title="Generate Bank Statement" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8">
              {/* Bank Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Select Your Bank
                </h2>
                
                {/* Bank Search Input */}
                <div className="relative" ref={bankSearchRef}>
                  <Label htmlFor="bankSearch">Bank Name *</Label>
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
                      placeholder="Type to search for your bank..."
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
                  
                  {/* Bank Dropdown */}
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
                                {bank.template === 'template-a' ? 'Style A' : bank.template === 'template-b' ? 'Style B' : 'Style C'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-slate-500 text-center">
                          No banks found matching your search.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Bank Confirmation */}
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
                        <p className="text-sm font-medium text-green-800 mb-1">✓ Bank Selected</p>
                        <p className="font-bold text-xl text-slate-800">{selectedBank.name}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          Template: <span className="font-semibold">{selectedBank.template === 'template-a' ? 'Style A (Chime)' : selectedBank.template === 'template-b' ? 'Style B (Bank of America)' : 'Style C (Chase)'}</span>
                        </p>
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                          <p className="text-xs text-amber-700">
                            ⚠️ You must upload your own bank logo below to generate the statement.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Logo Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                      Bank Logo *
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Upload a custom bank logo. PNG format only.
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
                          alt="Bank Logo Preview" 
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
                        accept=".png,image/png"
                        onChange={handleFileSelect}
                        className="hidden"
                        data-testid="logo-file-input"
                      />
                      <p className="text-xs text-slate-400 mt-3">
                        PNG format only
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
                    * A bank logo is required to generate your statement
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
                  <div className="flex items-center justify-center h-64 bg-slate-100 rounded-md">
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
                          <iframe
                            src={pdfPreview}
                            className="w-full h-64 pointer-events-none"
                            title="Bank Statement Preview"
                            style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
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
                      <div className="relative flex-1 h-full overflow-hidden">
                        <iframe
                          src={pdfPreview}
                          className="w-full h-[calc(90vh-80px)]"
                          title="Bank Statement Preview Full"
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
                  <div className="flex items-center justify-center h-64 bg-slate-50 rounded-md border-2 border-dashed border-slate-300">
                    <div className="text-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-slate-500">
                        Select a bank template<br />to see a preview
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* PayPal - Right Side */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Complete Payment
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Total: <strong>$50.00</strong> for bank statement generation
                </p>
                
                {!isFormValid() && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-700">
                      Please complete the following before payment:
                    </p>
                    <ul className="text-xs text-amber-600 mt-1 list-disc list-inside">
                      {!selectedBank && <li>Select a bank</li>}
                      {!uploadedLogo && <li>Upload a bank logo</li>}
                      {!accountName && <li>Enter account holder name</li>}
                      {!accountNumber && <li>Enter account number</li>}
                    </ul>
                  </div>
                )}
                
                <div data-testid="paypal-button-container-bank" className={!isFormValid() ? 'opacity-50 pointer-events-none' : ''}>
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    disabled={isProcessing || !isFormValid()}
                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
