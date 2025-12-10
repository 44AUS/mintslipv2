import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { generateAndDownloadBankStatement } from "@/utils/bankStatementGenerator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BankStatementForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create Razorpay order
      const orderResponse = await axios.post(`${API}/create-order`, {
        document_type: "bankstatement",
        amount: 5000  // ₹50 in paise
      });

      const { order_id, amount, currency, key_id } = orderResponse.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "DocuMint",
        description: "Bank Statement Generation",
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post(`${API}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              document_type: "bankstatement"
            });

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
            await generateAndDownloadBankStatement(formData);
            
            toast.success("Bank statement downloaded successfully!");
            setIsProcessing(false);
          } catch (error) {
            toast.error("Payment verification failed");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: accountName,
          email: "user@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#1a4731"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.error("Payment cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
      setIsProcessing(false);
    }
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
        <form onSubmit={handlePayment} className="space-y-8">
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

          <Button
            data-testid="pay-and-generate-statement-button"
            type="submit"
            disabled={isProcessing}
            className="w-full py-6 text-lg font-bold"
            style={{ backgroundColor: '#ccff00', color: '#000000' }}
          >
            {isProcessing ? "Processing..." : "Pay ₹50 & Generate"}
          </Button>
        </form>
      </div>
    </div>
  );
}