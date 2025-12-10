import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import axios from "axios";
import { generateAndDownloadPaystub } from "@/utils/paystubGenerator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PaystubForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    ssn: "",
    bank: "",
    bankName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    company: "",
    companyAddress: "",
    companyCity: "",
    companyState: "",
    companyZip: "",
    companyPhone: "",
    hireDate: "",
    rate: "",
    payFrequency: "biweekly",
    payDay: "Friday",
    numStubs: 1,
    hoursList: "",
    overtimeList: "",
    includeLocalTax: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const preview = useMemo(() => {
    const rate = parseFloat(formData.rate) || 0;
    const numStubs = parseInt(formData.numStubs) || 1;
    const defaultHours = formData.payFrequency === "weekly" ? 40 : 80;
    const hoursArray = formData.hoursList
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, numStubs) || [];
    const overtimeArray = formData.overtimeList
      .split(",")
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, numStubs) || [];

    const results = hoursArray.map((hrs, i) => {
      const baseHours = hrs || defaultHours;
      const overtime = overtimeArray[i] || 0;
      return rate * baseHours + rate * 1.5 * overtime;
    });

    const totalGross = results.reduce((a, b) => a + b, 0);
    const ssTax = totalGross * 0.062;
    const medTax = totalGross * 0.0145;
    const stateTax = totalGross * 0.05;
    const localTax = formData.includeLocalTax ? totalGross * 0.01 : 0;
    const totalTaxes = ssTax + medTax + stateTax + localTax;
    const netPay = totalGross - totalTaxes;

    return { totalGross, totalTaxes, netPay, ssTax, medTax, stateTax, localTax };
  }, [formData]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Create Razorpay order
      const orderResponse = await axios.post(`${API}/create-order`, {
        document_type: "paystub",
        amount: 1000  // ₹10 in paise
      });

      const { order_id, amount, currency, key_id } = orderResponse.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "DocuMint",
        description: "Pay Stub Generation",
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post(`${API}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              document_type: "paystub"
            });

            toast.success("Payment successful! Generating your document...");
            
            // Generate and download PDF
            await generateAndDownloadPaystub(formData);
            
            toast.success("Pay stub downloaded successfully!");
            setIsProcessing(false);
          } catch (error) {
            toast.error("Payment verification failed");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
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
            Generate Pay Stub
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handlePayment} className="space-y-8">
              {/* Employee Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Employee Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Employee Name *</Label>
                    <Input data-testid="employee-name-input" id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssn">Last 4 of SSN *</Label>
                    <Input data-testid="ssn-input" id="ssn" name="ssn" value={formData.ssn} onChange={handleChange} maxLength="4" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input data-testid="bank-name-input" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">Last 4 of Bank Account *</Label>
                    <Input data-testid="bank-account-input" id="bank" name="bank" value={formData.bank} onChange={handleChange} maxLength="4" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input data-testid="address-input" id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input data-testid="city-input" id="city" name="city" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input data-testid="state-input" id="state" name="state" value={formData.state} onChange={handleChange} maxLength="2" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code *</Label>
                    <Input data-testid="zip-input" id="zip" name="zip" value={formData.zip} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Company Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input data-testid="company-name-input" id="company" name="company" value={formData.company} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Company Address *</Label>
                    <Input data-testid="company-address-input" id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">Company City *</Label>
                    <Input data-testid="company-city-input" id="companyCity" name="companyCity" value={formData.companyCity} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyState">Company State *</Label>
                    <Input data-testid="company-state-input" id="companyState" name="companyState" value={formData.companyState} onChange={handleChange} maxLength="2" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyZip">Company Zip *</Label>
                    <Input data-testid="company-zip-input" id="companyZip" name="companyZip" value={formData.companyZip} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Company Phone *</Label>
                    <Input data-testid="company-phone-input" id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Pay Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date *</Label>
                    <Input data-testid="hire-date-input" id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate">Hourly Rate ($) *</Label>
                    <Input data-testid="hourly-rate-input" id="rate" name="rate" type="number" step="0.01" value={formData.rate} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payFrequency">Pay Frequency *</Label>
                    <Select value={formData.payFrequency} onValueChange={(val) => setFormData({...formData, payFrequency: val})}>
                      <SelectTrigger data-testid="pay-frequency-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numStubs">Number of Stubs *</Label>
                    <Input data-testid="num-stubs-input" id="numStubs" name="numStubs" type="number" min="1" max="10" value={formData.numStubs} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hoursList">Hours Worked (comma separated)</Label>
                    <Input data-testid="hours-list-input" id="hoursList" name="hoursList" placeholder="80, 80, 80" value={formData.hoursList} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtimeList">Overtime Hours (comma separated)</Label>
                    <Input data-testid="overtime-list-input" id="overtimeList" name="overtimeList" placeholder="0, 5, 0" value={formData.overtimeList} onChange={handleChange} />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    data-testid="local-tax-checkbox"
                    id="includeLocalTax"
                    checked={formData.includeLocalTax}
                    onCheckedChange={(checked) => setFormData({...formData, includeLocalTax: checked})}
                  />
                  <Label htmlFor="includeLocalTax" className="text-sm font-normal cursor-pointer">
                    Include local tax (1%)
                  </Label>
                </div>
              </div>

              <Button
                data-testid="pay-and-generate-button"
                type="submit"
                disabled={isProcessing}
                className="w-full py-6 text-lg font-bold"
                style={{ backgroundColor: '#ccff00', color: '#000000' }}
              >
                {isProcessing ? "Processing..." : "Pay ₹10 & Generate"}
              </Button>
            </form>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Total Gross Pay:</span>
                    <span className="font-bold">${preview.totalGross.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Social Security (6.2%):</span>
                    <span>${preview.ssTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Medicare (1.45%):</span>
                    <span>${preview.medTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">State Tax (5%):</span>
                    <span>${preview.stateTax.toFixed(2)}</span>
                  </div>
                  {formData.includeLocalTax && (
                    <div className="flex justify-between">
                      <span className="text-slate-700">Local Tax (1%):</span>
                      <span>${preview.localTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="flex justify-between text-red-700">
                      <span className="font-bold">Total Taxes:</span>
                      <span className="font-bold">${preview.totalTaxes.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-green-700 text-lg">
                    <span className="font-bold">Net Pay:</span>
                    <span className="font-bold">${preview.netPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}