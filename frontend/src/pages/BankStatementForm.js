import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadBankStatement } from "@/utils/bankStatementGenerator";
import { generateBankStatementPreview } from "@/utils/bankStatementPreviewGenerator";
import AddressAutocomplete from "@/components/AddressAutocomplete";

export default function BankStatementForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("template-a");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
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
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only generate preview if we have minimum required data
      if (selectedMonth) {
        setIsGeneratingPreview(true);
        try {
          const formData = {
            accountName,
            accountAddress1,
            accountAddress2,
            accountNumber,
            selectedMonth,
            beginningBalance,
            transactions
          };
          const previewUrl = await generateBankStatementPreview(formData, selectedTemplate);
          setPdfPreview(previewUrl);
        } catch (error) {
          console.error("Preview generation failed:", error);
        }
        setIsGeneratingPreview(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [accountName, accountAddress1, accountAddress2, accountNumber, selectedMonth, beginningBalance, transactions, selectedTemplate]);

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
      // ✔ Forces ZIP-only, no address collection
      // ✔ 100% valid for digital goods
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
        transactions
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

  return (
    <div className="min-h-screen bg-white relative">
      <div className="noise-overlay" />
      
      <Header title="Generate Bank Statement" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7">
            <form className="space-y-8">
              {/* Template Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Choose Template
                </h2>
                <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-a' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="template-a" id="bank-template-a" data-testid="bank-template-a-radio" />
                        <Label htmlFor="bank-template-a" className="cursor-pointer font-medium">Chime</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Chime inspired statement</p>
                    </div>
                    {/* <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-b' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="template-b" id="bank-template-b" data-testid="bank-template-b-radio" />
                        <Label htmlFor="bank-template-b" className="cursor-pointer font-medium">Bank of America</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Bank of America inspired statement</p>
                    </div>
                    <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-c' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="template-c" id="bank-template-c" data-testid="bank-template-c-radio" />
                        <Label htmlFor="bank-template-c" className="cursor-pointer font-medium">Chase</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Chase inspired statement</p>
                    </div> */}
                  </div>
                </RadioGroup>
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
                    <Input data-testid="account-number-input" id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required />
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

              {/* PayPal - Right Side */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Complete Payment
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Total: <strong>$50.00</strong> for bank statement generation
                </p>
                <div data-testid="paypal-button-container-bank">
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    disabled={isProcessing}
                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
