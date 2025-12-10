import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadBankStatement } from "@/utils/bankStatementGenerator";

export default function BankStatementForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("template-a");
  
  const [accountName, setAccountName] = useState("");
  const [accountAddress1, setAccountAddress1] = useState("");
  const [accountAddress2, setAccountAddress2] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [beginningBalance, setBeginningBalance] = useState("0.00");
  const [transactions, setTransactions] = useState([
    { date: "", description: "", type: "Purchase", amount: "" },
  ]);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${y}-${m}`);
  }, []);

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
      purchase_units: [
        {
          amount: {
            value: "50.00",
            currency_code: "USD"
          },
          description: "Bank Statement Generation"
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

  return (
    <div className="min-h-screen bg-white relative">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" style={{ color: '#1a4731' }} />
          </button>
          <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Generate Bank Statement
          </h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
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
                    <Label htmlFor="bank-template-a" className="cursor-pointer font-medium">Template A</Label>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Classic banking style</p>
                </div>
                <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-b' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template-b" id="bank-template-b" data-testid="bank-template-b-radio" />
                    <Label htmlFor="bank-template-b" className="cursor-pointer font-medium">Template B</Label>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Modern digital format</p>
                </div>
                <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-c' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template-c" id="bank-template-c" data-testid="bank-template-c-radio" />
                    <Label htmlFor="bank-template-c" className="cursor-pointer font-medium">Template C</Label>
                  </div>
                  <p className="text-xs text-slate-600 mt-2">Detailed statement</p>
                </div>
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
              <div className="space-y-2">
                <Label htmlFor="accountAddress1">Address Line 1 *</Label>
                <Input data-testid="address-line-1-input" id="accountAddress1" value={accountAddress1} onChange={(e) => setAccountAddress1(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountAddress2">Address Line 2 *</Label>
                <Input data-testid="address-line-2-input" id="accountAddress2" value={accountAddress2} onChange={(e) => setAccountAddress2(e.target.value)} required />
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
                      <Label className="text-xs">Description</Label>
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

          <div data-testid="paypal-button-container-bank">
            <PayPalButtons
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
              disabled={isProcessing}
              style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
