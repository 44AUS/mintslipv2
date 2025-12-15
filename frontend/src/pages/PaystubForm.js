import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { generateAndDownloadPaystub } from "@/utils/paystubGenerator";
import { generatePreviewPDF } from "@/utils/paystubPreviewGenerator";
import AddressAutocomplete from "@/components/AddressAutocomplete";

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
    workerType: "employee", // "employee" or "contractor"
    payType: "hourly", // "hourly" or "salary"
    annualSalary: "", // for salary pay type
  });

  // Determine if salary option should be available
  // Contractors on Gusto (template-a) can only use hourly
  const canUseSalary = !(formData.workerType === "contractor" && selectedTemplate === "template-a");
  
  // Auto-switch to hourly if contractor selects Gusto template
  const handleWorkerTypeChange = (val) => {
    setFormData(prev => {
      const newData = { ...prev, workerType: val };
      // If contractor on Gusto, force hourly
      if (val === "contractor" && selectedTemplate === "template-a") {
        newData.payType = "hourly";
      }
      return newData;
    });
  };

  // Handle template change - reset to hourly if contractor selects Gusto
  const handleTemplateChange = (val) => {
    setSelectedTemplate(val);
    if (formData.workerType === "contractor" && val === "template-a") {
      setFormData(prev => ({ ...prev, payType: "hourly" }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle employee address selection from Google Places
  const handleEmployeeAddressSelect = useCallback((addressData) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.address,
      city: addressData.city,
      state: addressData.state,
      zip: addressData.zip
    }));
  }, []);

  // Handle company address selection from Google Places
  const handleCompanyAddressSelect = useCallback((addressData) => {
    setFormData(prev => ({
      ...prev,
      companyAddress: addressData.address,
      companyCity: addressData.city,
      companyState: addressData.state,
      companyZip: addressData.zip
    }));
  }, []);

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
    const annualSalary = parseFloat(formData.annualSalary) || 0;
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

    let totalGross = 0;
    
    if (formData.payType === "salary") {
      // Calculate salary per pay period
      const periodsPerYear = formData.payFrequency === "weekly" ? 52 : 26;
      const salaryPerPeriod = annualSalary / periodsPerYear;
      totalGross = salaryPerPeriod * (numStubs || 1);
    } else {
      // Hourly calculation
      const results = hoursArray.map((hrs, i) => {
        const baseHours = hrs || defaultHours;
        const overtime = overtimeArray[i] || 0;
        return rate * baseHours + rate * 1.5 * overtime;
      });
      totalGross = results.reduce((a, b) => a + b, 0);
    }

    // Contractors don't have taxes withheld (they handle their own taxes)
    const isContractor = formData.workerType === "contractor";
    const ssTax = isContractor ? 0 : totalGross * 0.062;
    const medTax = isContractor ? 0 : totalGross * 0.0145;
    const stateTax = isContractor ? 0 : totalGross * 0.05;
    const localTax = isContractor ? 0 : (formData.includeLocalTax ? totalGross * 0.01 : 0);
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
          application_context: {
            shipping_preference: "NO_SHIPPING", // 🚫 removes shipping address prompt // 
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
                <RadioGroup value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-a' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="template-a" id="template-a" data-testid="template-a-radio" />
                        <Label htmlFor="template-a" className="cursor-pointer font-medium">Gusto</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Gusto style</p>
                    </div>
                    {/* <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${selectedTemplate === 'template-b' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
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
                    </div> */}
                  </div>
                </RadioGroup>
              </div>

              {/* Worker Type Selection */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Worker Type
                </h2>
                <RadioGroup value={formData.workerType} onValueChange={handleWorkerTypeChange}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${formData.workerType === 'employee' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="employee" id="worker-employee" data-testid="worker-employee-radio" />
                        <Label htmlFor="worker-employee" className="cursor-pointer font-medium">Employee (W-2)</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Standard employee with tax withholdings</p>
                    </div>
                    <div className={`border-2 rounded-md p-4 cursor-pointer transition-all ${formData.workerType === 'contractor' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="contractor" id="worker-contractor" data-testid="worker-contractor-radio" />
                        <Label htmlFor="worker-contractor" className="cursor-pointer font-medium">Contractor (1099)</Label>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Independent contractor, no tax withholdings</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Employee/Contractor Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  {formData.workerType === 'contractor' ? 'Contractor Information' : 'Employee Information'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{formData.workerType === 'contractor' ? 'Contractor Name *' : 'Employee Name *'}</Label>
                    <Input data-testid="employee-name-input" id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssn">{formData.workerType === 'contractor' ? 'Last 4 of SSN/EIN *' : 'Last 4 of SSN *'}</Label>
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input data-testid="address-input" id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input data-testid="city-input" id="city" name="city" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(val) => setFormData({...formData, state: val})}>
                      <SelectTrigger data-testid="pay-day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="companyPhone">Company Phone *</Label>
                    <Input data-testid="company-phone-input" id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddress">Company Address *</Label>
                    <Input data-testid="company-address-input" id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">Company City *</Label>
                    <Input data-testid="company-city-input" id="companyCity" name="companyCity" value={formData.companyCity} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyState">Company State *</Label>
                      <Select value={formData.companyState} onValueChange={(val) => setFormData({...formData, companyState: val})}>
                      <SelectTrigger data-testid="pay-day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyZip">Company Zip *</Label>
                    <Input data-testid="company-zip-input" id="companyZip" name="companyZip" value={formData.companyZip} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Pay Information */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Information
                </h2>
                
                {/* Pay Type Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Pay Type *</Label>
                  <RadioGroup 
                    value={formData.payType} 
                    onValueChange={(val) => setFormData({...formData, payType: val})}
                    className="flex flex-row gap-4"
                  >
                    <div className={`border-2 rounded-md p-3 cursor-pointer transition-all flex-1 ${formData.payType === 'hourly' ? 'border-green-800 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hourly" id="pay-hourly" data-testid="pay-hourly-radio" />
                        <Label htmlFor="pay-hourly" className="cursor-pointer font-medium">Hourly</Label>
                      </div>
                    </div>
                    <div className={`border-2 rounded-md p-3 cursor-pointer transition-all flex-1 ${formData.payType === 'salary' ? 'border-green-800 bg-green-50' : 'border-slate-200'} ${!canUseSalary ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="salary" 
                          id="pay-salary" 
                          data-testid="pay-salary-radio" 
                          disabled={!canUseSalary}
                        />
                        <Label htmlFor="pay-salary" className={`cursor-pointer font-medium ${!canUseSalary ? 'text-slate-400' : ''}`}>
                          Salary
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                  {!canUseSalary && (
                    <p className="text-xs text-amber-600 mt-1">
                      * Salary option not available for contractors on Gusto template
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">{formData.workerType === 'contractor' ? 'Start Date *' : 'Hire Date *'}</Label>
                    <Input data-testid="hire-date-input" id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required />
                  </div>
                  
                  {formData.payType === 'hourly' ? (
                    <div className="space-y-2">
                      <Label htmlFor="rate">Hourly Rate ($) *</Label>
                      <Input data-testid="hourly-rate-input" id="rate" name="rate" type="number" step="0.01" value={formData.rate} onChange={handleChange} required />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="annualSalary">Annual Salary ($) *</Label>
                      <Input data-testid="annual-salary-input" id="annualSalary" name="annualSalary" type="number" step="0.01" value={formData.annualSalary} onChange={handleChange} required />
                    </div>
                  )}
                  
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

                {/* Hours input - only for hourly pay type */}
                {formData.payType === 'hourly' && (
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
                )}

                {/* Tax option - only for employees */}
                {formData.workerType === 'employee' && (
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
                )}
                
                {formData.workerType === 'contractor' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> As a contractor (1099), no taxes will be withheld. You are responsible for paying your own self-employment taxes.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right: Preview and PayPal */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {/* Pay Preview */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-md">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Pay Preview {formData.workerType === 'contractor' && <span className="text-sm font-normal text-amber-700">(1099 Contractor)</span>}
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
                  
                  {formData.workerType === 'employee' ? (
                    <>
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
                    </>
                  ) : (
                    <div className="border-t border-green-300 pt-2 mt-2">
                      <div className="flex justify-between text-amber-700">
                        <span className="font-bold">No Taxes Withheld</span>
                        <span className="font-bold">$0.00</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-green-700 text-lg">
                    <span className="font-bold">{formData.workerType === 'contractor' ? 'Total Payment:' : 'Net Pay:'}</span>
                    <span className="font-bold">${preview.netPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* PayPal - Under Preview */}
              <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-md">
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                  Complete Payment
                </h3>
                {calculateNumStubs > 0 && (
                  <p className="text-sm text-slate-600 mb-4">
                    Total: <strong>${(calculateNumStubs * 10).toFixed(2)}</strong> ({calculateNumStubs} stub{calculateNumStubs > 1 ? 's' : ''} × $10)
                  </p>
                )}
                <div data-testid="paypal-button-container">
                  <PayPalButtons
                    createOrder={createOrder}
                    onApprove={onApprove}
                    onError={onError}
                    disabled={isProcessing || calculateNumStubs === 0}
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
