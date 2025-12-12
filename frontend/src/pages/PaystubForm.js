import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadPaystub } from "@/utils/paystubGenerator";

export default function PaystubForm() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("template-a");
  
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
    startDate: "",
    endDate: "",
    rate: "",
    payFrequency: "biweekly",
    payDay: "Friday",
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

  const calculateNumStubs = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const periodLength = formData.payFrequency === "biweekly" ? 14 : 7;
    return Math.ceil(diffDays / periodLength);
  }, [formData.startDate, formData.endDate, formData.payFrequency]);

  const preview = useMemo(() => {
    const rate = parseFloat(formData.rate) || 0;
    const numStubs = calculateNumStubs;
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

    return { totalGross, totalTaxes, netPay, ssTax, medTax, stateTax, localTax, numStubs };
  }, [formData, calculateNumStubs]);

  const createOrder = (data, actions) => {
    const totalAmount = (calculateNumStubs * 10).toFixed(2);
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: totalAmount,
            currency_code: "USD"
          },
          description: `Pay Stub Generation (${calculateNumStubs} stub${calculateNumStubs > 1 ? 's' : ''})`
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
      await generateAndDownloadPaystub(formData, selectedTemplate, calculateNumStubs);
      
      toast.success("Pay stub(s) downloaded successfully!");
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
      
      <Header title="Generate Pay Stub" />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-7 space-y-8">
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
                        <RadioGroupItem value="template-a" id="template-a" data-testid="template-a-radio" />
                        <Label htmlFor="template-a" className="cursor-pointer font-medium">Gusto</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Gusto style</p>
                    </div>
                    <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-b' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="template-b" id="template-b" data-testid="template-b-radio" />
                        <Label htmlFor="template-b" className="cursor-pointer font-medium">ADP</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">ADP layout</p>
                    </div>
                    <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-c' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="template-c" id="template-c" data-testid="template-c-radio" />
                        <Label htmlFor="template-c" className="cursor-pointer font-medium">Workday</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Workday style</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

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
                    <Label htmlFor="payDay">Pay Day *</Label>
                    <Select value={formData.payDay} onValueChange={(val) => setFormData({...formData, payDay: val})}>
                      <SelectTrigger data-testid="pay-day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Paystub Generation Period *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input data-testid="start-date-input" id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input data-testid="end-date-input" id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                    </div>
                  </div>
                  {calculateNumStubs > 0 && (
                    <p className="text-sm text-slate-600 mt-2">
                      This will generate <strong>{calculateNumStubs}</strong> paystub{calculateNumStubs > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div data-testid="paypal-button-container">
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

          {/* Right: Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Preview
                </h3>
                <div className="space-y-2 text-sm">
                  {preview.numStubs > 0 && (
                    <div className="flex justify-between mb-3 pb-3 border-b border-green-300">
                      <span className="text-slate-700 font-semibold">Paystubs to Generate:</span>
                      <span className="font-bold">{preview.numStubs}</span>
                    </div>
                  )}
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
