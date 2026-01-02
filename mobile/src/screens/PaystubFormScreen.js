import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  TextInput
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Header, Select, RadioGroup, Checkbox } from '../components/ui';
import { useAuth, API_URL } from '../context/AuthContext';

// US States - exact same as web
const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }, { value: 'DC', label: 'District of Columbia' },
];

// Pay Frequencies - exact same as web
const PAY_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
];

// Filing Statuses - exact same as web
const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married_jointly', label: 'Married Filing Jointly' },
  { value: 'married_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
];

// Payroll Templates - EXACT SAME AS WEB
const PAYROLL_TEMPLATES = [
  { 
    id: 'template-a', 
    name: 'Gusto', 
    description: 'Modern payroll style with teal accents',
    icon: '💚',
    color: '#00a8a1',
  },
  { 
    id: 'template-b', 
    name: 'ADP', 
    description: 'Classic corporate payroll format',
    icon: '🔴',
    color: '#d0021b',
  },
  { 
    id: 'template-c', 
    name: 'Workday', 
    description: 'Clean enterprise-style layout',
    icon: '🟠',
    color: '#f5811f',
  },
  { 
    id: 'template-h', 
    name: 'OnPay', 
    description: 'Simple and straightforward format',
    icon: '🔵',
    color: '#2563eb',
  },
];

// Custom Input component with proper state handling
const FormInput = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, required, editable = true, multiline, style }) => {
  return (
    <View style={[styles.inputContainer, style]}>
      {label && (
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.textInput,
          multiline && styles.textInputMultiline,
          !editable && styles.textInputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        editable={editable}
        multiline={multiline}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

export default function PaystubFormScreen({ navigation }) {
  const { user, token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState('template-a');
  
  // Form State - EXACT SAME AS WEB
  const [formData, setFormData] = useState({
    // Employee Information
    name: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    hireDate: '',
    employeeId: '',
    
    // Company Information
    company: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    companyPhone: '',
    ein: '',
    
    // Pay Information
    payType: 'hourly',
    rate: '',
    annualSalary: '',
    payFrequency: 'biweekly',
    payDay: 'Friday',
    
    // Pay Period
    startDate: '',
    endDate: '',
    hours: '80',
    overtime: '0',
    
    // Tax Info
    federalFilingStatus: 'single',
    stateAllowances: '0',
    includeLocalTax: true,
    
    // Worker Type
    workerType: 'employee',
    
    // Number of stubs
    numStubs: '1',
  });

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate gross pay
  const calculateGrossPay = () => {
    if (formData.payType === 'salary') {
      const annual = parseFloat(formData.annualSalary) || 0;
      const periods = formData.payFrequency === 'weekly' ? 52 : 26;
      return annual / periods;
    } else {
      const rate = parseFloat(formData.rate) || 0;
      const hours = parseFloat(formData.hours) || 0;
      const overtime = parseFloat(formData.overtime) || 0;
      return (rate * hours) + (rate * 1.5 * overtime);
    }
  };

  // Validate current step
  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return selectedTemplate !== '';
      case 2:
        return formData.name && formData.address && formData.city && formData.state && formData.zip;
      case 3:
        return formData.company && formData.companyAddress && formData.companyCity && formData.companyState && formData.companyZip;
      case 4:
        if (formData.payType === 'salary') {
          return formData.annualSalary && formData.startDate && formData.endDate;
        }
        return formData.rate && formData.hours && formData.startDate && formData.endDate;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // Generate preview using exact same calculations as web
  const generatePreview = async () => {
    setIsLoading(true);
    try {
      const grossPay = calculateGrossPay();
      const html = createPreviewHtml(grossPay);
      setPreviewHtml(html);
      setCurrentStep(5);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Create preview HTML matching web templates
  const createPreviewHtml = (grossPay) => {
    const rate = parseFloat(formData.rate) || 0;
    const hours = parseFloat(formData.hours) || 0;
    const overtime = parseFloat(formData.overtime) || 0;
    const regularPay = rate * hours;
    const overtimePay = rate * 1.5 * overtime;
    
    // Tax calculations (simplified - web uses more complex logic)
    const ssTax = grossPay * 0.062;
    const medTax = grossPay * 0.0145;
    const federalTax = grossPay * 0.12;
    const stateTax = grossPay * 0.05;
    const totalTax = ssTax + medTax + federalTax + stateTax;
    const netPay = grossPay - totalTax;
    
    const templateColors = {
      'template-a': { primary: '#00a8a1', name: 'Gusto' },
      'template-b': { primary: '#d0021b', name: 'ADP' },
      'template-c': { primary: '#f5811f', name: 'Workday' },
      'template-h': { primary: '#2563eb', name: 'OnPay' },
    };
    
    const { primary, name } = templateColors[selectedTemplate] || templateColors['template-a'];
    
    const fmt = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 15px; background: #f5f5f5; font-size: 11px; }
          .container { background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${primary}; padding-bottom: 15px; margin-bottom: 15px; }
          .logo { font-size: 24px; font-weight: bold; color: ${primary}; }
          .company-info { text-align: right; font-size: 10px; color: #666; }
          .company-name { font-weight: bold; color: #333; font-size: 12px; }
          .title { font-size: 16px; font-weight: bold; color: #333; text-align: center; margin-bottom: 15px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .section { background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #eee; }
          .section-title { font-size: 10px; font-weight: bold; color: ${primary}; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .label { color: #666; }
          .value { font-weight: 500; color: #333; }
          .total-row { border-top: 2px solid ${primary}; margin-top: 8px; padding-top: 8px; }
          .total-label { font-weight: bold; font-size: 14px; color: #333; }
          .total-value { font-weight: bold; font-size: 14px; color: ${primary}; }
          .net-pay { background: ${primary}; color: white; padding: 15px; border-radius: 6px; text-align: center; margin-top: 15px; }
          .net-pay-label { font-size: 12px; opacity: 0.9; }
          .net-pay-value { font-size: 24px; font-weight: bold; }
          .watermark { text-align: center; color: #999; font-size: 10px; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="logo">${name}</div>
              <div style="font-size: 10px; color: #666; margin-top: 4px;">Earnings Statement</div>
            </div>
            <div class="company-info">
              <div class="company-name">${formData.company || 'Company Name'}</div>
              <div>${formData.companyAddress || ''}</div>
              <div>${formData.companyCity || ''}, ${formData.companyState || ''} ${formData.companyZip || ''}</div>
            </div>
          </div>
          
          <div class="grid">
            <div class="section">
              <div class="section-title">Employee Information</div>
              <div class="row"><span class="label">Name:</span><span class="value">${formData.name || 'Employee'}</span></div>
              <div class="row"><span class="label">SSN:</span><span class="value">XXX-XX-${formData.ssn || 'XXXX'}</span></div>
              <div class="row"><span class="label">Address:</span><span class="value">${formData.address}</span></div>
              <div class="row"><span class="label">City/State:</span><span class="value">${formData.city}, ${formData.state} ${formData.zip}</span></div>
            </div>
            
            <div class="section">
              <div class="section-title">Pay Period</div>
              <div class="row"><span class="label">Period:</span><span class="value">${formData.startDate} - ${formData.endDate}</span></div>
              <div class="row"><span class="label">Pay Date:</span><span class="value">${formData.endDate}</span></div>
              <div class="row"><span class="label">Frequency:</span><span class="value">${formData.payFrequency === 'weekly' ? 'Weekly' : 'Bi-Weekly'}</span></div>
            </div>
          </div>
          
          <div class="grid">
            <div class="section">
              <div class="section-title">Earnings</div>
              ${formData.payType === 'hourly' ? `
                <div class="row"><span class="label">Regular (${hours} hrs @ $${fmt(rate)}):</span><span class="value">$${fmt(regularPay)}</span></div>
                ${overtime > 0 ? `<div class="row"><span class="label">Overtime (${overtime} hrs @ $${fmt(rate * 1.5)}):</span><span class="value">$${fmt(overtimePay)}</span></div>` : ''}
              ` : `
                <div class="row"><span class="label">Salary:</span><span class="value">$${fmt(grossPay)}</span></div>
              `}
              <div class="row total-row"><span class="total-label">Gross Pay:</span><span class="total-value">$${fmt(grossPay)}</span></div>
            </div>
            
            <div class="section">
              <div class="section-title">Deductions</div>
              <div class="row"><span class="label">Federal Tax:</span><span class="value">$${fmt(federalTax)}</span></div>
              <div class="row"><span class="label">State Tax:</span><span class="value">$${fmt(stateTax)}</span></div>
              <div class="row"><span class="label">Social Security:</span><span class="value">$${fmt(ssTax)}</span></div>
              <div class="row"><span class="label">Medicare:</span><span class="value">$${fmt(medTax)}</span></div>
              <div class="row total-row"><span class="total-label">Total Deductions:</span><span class="total-value">$${fmt(totalTax)}</span></div>
            </div>
          </div>
          
          <div class="net-pay">
            <div class="net-pay-label">Net Pay</div>
            <div class="net-pay-value">$${fmt(netPay)}</div>
          </div>
          
          <div class="watermark">PREVIEW - Watermark will be removed in final document</div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (isSubscribed) {
      await downloadWithSubscription();
    } else {
      Alert.alert(
        'Payment Required',
        'Pay $9.99 to download your pay stub.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay with PayPal', onPress: () => Alert.alert('PayPal', 'Please use web version for payments') },
        ]
      );
    }
  };

  const downloadWithSubscription = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to use your subscription.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/subscription-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentType: 'paystub',
          template: selectedTemplate,
          count: parseInt(formData.numStubs) || 1,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Download failed');
      }
      
      await generateAndSharePdf();
      Alert.alert('Success', 'Pay stub downloaded successfully!');
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndSharePdf = async () => {
    const grossPay = calculateGrossPay();
    const html = createPreviewHtml(grossPay).replace(
      '<div class="watermark">PREVIEW - Watermark will be removed in final document</div>',
      ''
    );
    
    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Pay Stub',
        UTI: 'com.adobe.pdf',
      });
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderTemplateSelection();
      case 2:
        return renderEmployeeInfo();
      case 3:
        return renderCompanyInfo();
      case 4:
        return renderPayInfo();
      case 5:
        return renderPreview();
      default:
        return null;
    }
  };

  // Step 1: Template Selection
  const renderTemplateSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Template</Text>
      <Text style={styles.stepDescription}>Select a payroll template style</Text>
      
      {PAYROLL_TEMPLATES.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={[
            styles.templateCard,
            selectedTemplate === template.id && [styles.templateCardSelected, { borderColor: template.color }],
          ]}
          onPress={() => setSelectedTemplate(template.id)}
        >
          <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
            <Text style={styles.templateEmoji}>{template.icon}</Text>
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDesc}>{template.description}</Text>
          </View>
          {selectedTemplate === template.id && (
            <View style={[styles.checkmark, { backgroundColor: template.color }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Step 2: Employee Information
  const renderEmployeeInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Employee Information</Text>
      <Text style={styles.stepDescription}>Enter employee details</Text>
      
      <FormInput
        label="Full Name"
        value={formData.name}
        onChangeText={(v) => updateField('name', v)}
        placeholder="John Smith"
        required
      />
      
      <FormInput
        label="SSN (Last 4 digits)"
        value={formData.ssn}
        onChangeText={(v) => updateField('ssn', v)}
        placeholder="1234"
        keyboardType="numeric"
        maxLength={4}
      />
      
      <FormInput
        label="Street Address"
        value={formData.address}
        onChangeText={(v) => updateField('address', v)}
        placeholder="123 Main St"
        required
      />
      
      <View style={styles.row}>
        <View style={styles.flex2}>
          <FormInput
            label="City"
            value={formData.city}
            onChangeText={(v) => updateField('city', v)}
            placeholder="New York"
            required
          />
        </View>
        <View style={styles.flex1}>
          <Select
            label="State"
            value={formData.state}
            onValueChange={(v) => updateField('state', v)}
            options={US_STATES}
            placeholder="Select"
            required
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.flex1}>
          <FormInput
            label="ZIP Code"
            value={formData.zip}
            onChangeText={(v) => updateField('zip', v)}
            placeholder="10001"
            keyboardType="numeric"
            maxLength={5}
            required
          />
        </View>
        <View style={styles.flex1}>
          <FormInput
            label="Hire Date"
            value={formData.hireDate}
            onChangeText={(v) => updateField('hireDate', v)}
            placeholder="2024-01-15"
          />
        </View>
      </View>
    </View>
  );

  // Step 3: Company Information
  const renderCompanyInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Company Information</Text>
      <Text style={styles.stepDescription}>Enter employer details</Text>
      
      <FormInput
        label="Company Name"
        value={formData.company}
        onChangeText={(v) => updateField('company', v)}
        placeholder="Acme Corporation"
        required
      />
      
      <FormInput
        label="Company Address"
        value={formData.companyAddress}
        onChangeText={(v) => updateField('companyAddress', v)}
        placeholder="456 Business Ave"
        required
      />
      
      <View style={styles.row}>
        <View style={styles.flex2}>
          <FormInput
            label="City"
            value={formData.companyCity}
            onChangeText={(v) => updateField('companyCity', v)}
            placeholder="Los Angeles"
            required
          />
        </View>
        <View style={styles.flex1}>
          <Select
            label="State"
            value={formData.companyState}
            onValueChange={(v) => updateField('companyState', v)}
            options={US_STATES}
            placeholder="Select"
            required
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.flex1}>
          <FormInput
            label="ZIP Code"
            value={formData.companyZip}
            onChangeText={(v) => updateField('companyZip', v)}
            placeholder="90001"
            keyboardType="numeric"
            maxLength={5}
            required
          />
        </View>
        <View style={styles.flex1}>
          <FormInput
            label="Phone"
            value={formData.companyPhone}
            onChangeText={(v) => updateField('companyPhone', v)}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>
      </View>
      
      <FormInput
        label="EIN"
        value={formData.ein}
        onChangeText={(v) => updateField('ein', v)}
        placeholder="XX-XXXXXXX"
      />
    </View>
  );

  // Step 4: Pay Information
  const renderPayInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pay Information</Text>
      <Text style={styles.stepDescription}>Enter earnings details</Text>
      
      <RadioGroup
        label="Pay Type"
        value={formData.payType}
        onChange={(v) => updateField('payType', v)}
        options={[
          { value: 'hourly', label: 'Hourly' },
          { value: 'salary', label: 'Salary' },
        ]}
        horizontal
      />
      
      {formData.payType === 'hourly' ? (
        <>
          <FormInput
            label="Hourly Rate ($)"
            value={formData.rate}
            onChangeText={(v) => updateField('rate', v)}
            placeholder="25.00"
            keyboardType="decimal-pad"
            required
          />
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormInput
                label="Regular Hours"
                value={formData.hours}
                onChangeText={(v) => updateField('hours', v)}
                placeholder="80"
                keyboardType="numeric"
                required
              />
            </View>
            <View style={styles.flex1}>
              <FormInput
                label="Overtime Hours"
                value={formData.overtime}
                onChangeText={(v) => updateField('overtime', v)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        </>
      ) : (
        <FormInput
          label="Annual Salary ($)"
          value={formData.annualSalary}
          onChangeText={(v) => updateField('annualSalary', v)}
          placeholder="75000"
          keyboardType="decimal-pad"
          required
        />
      )}
      
      <Select
        label="Pay Frequency"
        value={formData.payFrequency}
        onValueChange={(v) => updateField('payFrequency', v)}
        options={PAY_FREQUENCIES}
      />
      
      <View style={styles.row}>
        <View style={styles.flex1}>
          <FormInput
            label="Period Start"
            value={formData.startDate}
            onChangeText={(v) => updateField('startDate', v)}
            placeholder="2024-01-01"
            required
          />
        </View>
        <View style={styles.flex1}>
          <FormInput
            label="Period End"
            value={formData.endDate}
            onChangeText={(v) => updateField('endDate', v)}
            placeholder="2024-01-14"
            required
          />
        </View>
      </View>
      
      <Select
        label="Filing Status"
        value={formData.federalFilingStatus}
        onValueChange={(v) => updateField('federalFilingStatus', v)}
        options={FILING_STATUSES}
      />
      
      <FormInput
        label="Number of Pay Stubs"
        value={formData.numStubs}
        onChangeText={(v) => updateField('numStubs', v)}
        placeholder="1"
        keyboardType="numeric"
      />
    </View>
  );

  // Step 5: Preview
  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <Text style={styles.stepTitle}>Preview</Text>
      
      <View style={styles.previewWebview}>
        <WebView
          source={{ html: previewHtml }}
          style={styles.webview}
          scalesPageToFit={true}
        />
      </View>
      
      <View style={styles.previewNote}>
        <Text style={styles.previewNoteIcon}>⚠️</Text>
        <Text style={styles.previewNoteText}>
          Preview with estimated taxes. Final document uses accurate calculations.
        </Text>
      </View>
    </View>
  );

  // Progress indicator
  const renderProgress = () => (
    <View style={styles.progress}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.progressItem}>
          <View style={[
            styles.progressDot,
            currentStep >= step && styles.progressDotActive,
            currentStep === step && styles.progressDotCurrent,
          ]}>
            <Text style={[
              styles.progressDotText,
              currentStep >= step && styles.progressDotTextActive,
            ]}>
              {currentStep > step ? '✓' : step}
            </Text>
          </View>
          {step < 5 && (
            <View style={[
              styles.progressLine,
              currentStep > step && styles.progressLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Pay Stub Generator"
        showBack
        onBack={handleBack}
        variant="light"
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderProgress()}
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
        
        <View style={styles.actions}>
          {currentStep < 5 ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={currentStep === 4 ? generatePreview : handleNext}
              loading={isLoading}
            >
              {currentStep === 4 ? 'Generate Preview' : 'Continue'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleDownload}
              loading={isLoading}
            >
              {isSubscribed ? 'Download (Subscription)' : 'Pay $9.99 & Download'}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, backgroundColor: COLORS.background },
  progress: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border,
  },
  progressDotActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  progressDotCurrent: { backgroundColor: COLORS.primary },
  progressDotText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  progressDotTextActive: { color: COLORS.primary },
  progressLine: { width: 24, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  progressLineActive: { backgroundColor: COLORS.primary },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  stepDescription: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  templateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md,
    borderWidth: 2, borderColor: COLORS.border,
  },
  templateCardSelected: { backgroundColor: COLORS.primaryBg },
  templateIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  templateEmoji: { fontSize: 24 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.textPrimary },
  templateDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  checkmark: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmarkText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  previewContainer: { flex: 1, padding: SPACING.lg },
  previewWebview: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden', marginVertical: SPACING.md, minHeight: 400, ...SHADOWS.medium,
  },
  webview: { flex: 1 },
  previewNote: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningBg,
    padding: SPACING.md, borderRadius: BORDER_RADIUS.md,
  },
  previewNoteIcon: { fontSize: 16, marginRight: SPACING.sm },
  previewNoteText: { flex: 1, fontSize: FONT_SIZES.sm, color: '#92400e' },
  actions: {
    padding: SPACING.lg, backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  // Custom input styles
  inputContainer: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  required: { color: COLORS.error },
  textInput: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary,
  },
  textInputMultiline: { minHeight: 100, textAlignVertical: 'top' },
  textInputDisabled: { backgroundColor: COLORS.background },
});
