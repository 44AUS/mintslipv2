import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Input, Select, Header, RadioGroup, Checkbox, Card } from '../components/ui';
import { useAuth, API_URL } from '../context/AuthContext';
import { US_STATES, PAY_FREQUENCIES, FILING_STATUSES, PAYROLL_TEMPLATES } from '../constants/formData';

export default function PaystubFormScreen({ navigation }) {
  const { user, token, isGuest, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  // Template Selection
  const [selectedTemplate, setSelectedTemplate] = useState('template-a');
  
  // Form State - Employee Info
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
    
    // Bank Info
    bankName: '',
    bank: '',
    
    // Worker Type
    workerType: 'employee',
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
      case 1: // Template Selection
        return selectedTemplate !== '';
      case 2: // Employee Info
        return formData.name && formData.address && formData.city && formData.state && formData.zip;
      case 3: // Company Info
        return formData.company && formData.companyAddress && formData.companyCity && formData.companyState && formData.companyZip;
      case 4: // Pay Info
        if (formData.payType === 'salary') {
          return formData.annualSalary && formData.startDate && formData.endDate;
        }
        return formData.rate && formData.hours && formData.startDate && formData.endDate;
      default:
        return true;
    }
  };

  // Handle next step
  const handleNext = () => {
    if (!validateStep()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  // Generate preview
  const generatePreview = async () => {
    setIsLoading(true);
    try {
      // Create preview HTML (simplified for mobile)
      const grossPay = calculateGrossPay();
      const html = createPreviewHtml(grossPay);
      setPreviewHtml(html);
      setShowPreview(true);
      setCurrentStep(5);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Create preview HTML
  const createPreviewHtml = (grossPay) => {
    const netPay = grossPay * 0.75; // Simplified tax estimation
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #15803d; padding-bottom: 15px; margin-bottom: 15px; }
          .company { font-size: 24px; font-weight: bold; color: #15803d; }
          .title { font-size: 14px; color: #666; margin-top: 5px; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .label { color: #666; }
          .value { font-weight: 500; }
          .total { font-size: 18px; color: #15803d; font-weight: bold; }
          .watermark { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company">${formData.company || 'Company Name'}</div>
            <div class="title">EARNINGS STATEMENT</div>
          </div>
          
          <div class="section">
            <div class="section-title">Employee Information</div>
            <div class="row"><span class="label">Name:</span><span class="value">${formData.name || 'Employee Name'}</span></div>
            <div class="row"><span class="label">Address:</span><span class="value">${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Pay Period</div>
            <div class="row"><span class="label">Period:</span><span class="value">${formData.startDate} - ${formData.endDate}</span></div>
            <div class="row"><span class="label">Pay Date:</span><span class="value">${formData.endDate}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Earnings</div>
            ${formData.payType === 'hourly' ? `
              <div class="row"><span class="label">Regular (${formData.hours} hrs @ $${formData.rate}):</span><span class="value">$${(parseFloat(formData.rate) * parseFloat(formData.hours)).toFixed(2)}</span></div>
              ${parseFloat(formData.overtime) > 0 ? `<div class="row"><span class="label">Overtime (${formData.overtime} hrs @ $${(parseFloat(formData.rate) * 1.5).toFixed(2)}):</span><span class="value">$${(parseFloat(formData.rate) * 1.5 * parseFloat(formData.overtime)).toFixed(2)}</span></div>` : ''}
            ` : `
              <div class="row"><span class="label">Salary:</span><span class="value">$${grossPay.toFixed(2)}</span></div>
            `}
            <div class="row"><span class="label">Gross Pay:</span><span class="value total">$${grossPay.toFixed(2)}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Deductions (Estimated)</div>
            <div class="row"><span class="label">Federal Tax:</span><span class="value">$${(grossPay * 0.12).toFixed(2)}</span></div>
            <div class="row"><span class="label">State Tax:</span><span class="value">$${(grossPay * 0.05).toFixed(2)}</span></div>
            <div class="row"><span class="label">Social Security:</span><span class="value">$${(grossPay * 0.062).toFixed(2)}</span></div>
            <div class="row"><span class="label">Medicare:</span><span class="value">$${(grossPay * 0.0145).toFixed(2)}</span></div>
          </div>
          
          <div class="section">
            <div class="row"><span class="label" style="font-size: 18px;">Net Pay:</span><span class="value total">$${netPay.toFixed(2)}</span></div>
          </div>
          
          <div class="watermark">PREVIEW - Watermark will be removed in final document</div>
        </div>
      </body>
      </html>
    `;
  };

  // Handle payment/download
  const handleDownload = async () => {
    if (isSubscribed) {
      // Use subscription
      await downloadWithSubscription();
    } else {
      // Show payment options
      Alert.alert(
        'Payment Required',
        'Pay $9.99 to download your pay stub.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay with PayPal', onPress: () => handlePayPalPayment() },
        ]
      );
    }
  };

  // Download with subscription
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
          count: 1,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Download failed');
      }
      
      // Generate and share PDF
      await generateAndSharePdf();
      
      Alert.alert('Success', 'Pay stub downloaded successfully!');
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate and share PDF
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

  // Handle PayPal payment
  const handlePayPalPayment = () => {
    // Navigate to PayPal webview or external link
    Alert.alert('PayPal', 'PayPal integration coming soon. Please use the web version for payments.');
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
      <Text style={styles.stepDescription}>Select a payroll template style for your pay stub</Text>
      
      {PAYROLL_TEMPLATES.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={[
            styles.templateCard,
            selectedTemplate === template.id && styles.templateCardSelected,
          ]}
          onPress={() => setSelectedTemplate(template.id)}
        >
          <View style={styles.templateIcon}>
            <Text style={styles.templateEmoji}>{template.icon}</Text>
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDesc}>{template.description}</Text>
          </View>
          {selectedTemplate === template.id && (
            <View style={styles.checkmark}>
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
      <Text style={styles.stepDescription}>Enter the employee's personal details</Text>
      
      <Input
        label="Full Name"
        value={formData.name}
        onChangeText={(v) => updateField('name', v)}
        placeholder="John Smith"
        required
      />
      
      <Input
        label="SSN (Last 4 digits)"
        value={formData.ssn}
        onChangeText={(v) => updateField('ssn', v)}
        placeholder="XXXX"
        keyboardType="numeric"
        maxLength={4}
      />
      
      <Input
        label="Street Address"
        value={formData.address}
        onChangeText={(v) => updateField('address', v)}
        placeholder="123 Main St"
        required
      />
      
      <View style={styles.row}>
        <View style={styles.flex2}>
          <Input
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
          <Input
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
          <Input
            label="Hire Date"
            value={formData.hireDate}
            onChangeText={(v) => updateField('hireDate', v)}
            placeholder="MM/DD/YYYY"
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
      
      <Input
        label="Company Name"
        value={formData.company}
        onChangeText={(v) => updateField('company', v)}
        placeholder="Acme Corporation"
        required
      />
      
      <Input
        label="Company Address"
        value={formData.companyAddress}
        onChangeText={(v) => updateField('companyAddress', v)}
        placeholder="456 Business Ave"
        required
      />
      
      <View style={styles.row}>
        <View style={styles.flex2}>
          <Input
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
          <Input
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
          <Input
            label="Phone"
            value={formData.companyPhone}
            onChangeText={(v) => updateField('companyPhone', v)}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </View>
  );

  // Step 4: Pay Information
  const renderPayInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pay Information</Text>
      <Text style={styles.stepDescription}>Enter earnings and pay period details</Text>
      
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
          <Input
            label="Hourly Rate ($)"
            value={formData.rate}
            onChangeText={(v) => updateField('rate', v)}
            placeholder="25.00"
            keyboardType="decimal-pad"
            required
          />
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Input
                label="Regular Hours"
                value={formData.hours}
                onChangeText={(v) => updateField('hours', v)}
                placeholder="80"
                keyboardType="numeric"
                required
              />
            </View>
            <View style={styles.flex1}>
              <Input
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
        <Input
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
          <Input
            label="Period Start"
            value={formData.startDate}
            onChangeText={(v) => updateField('startDate', v)}
            placeholder="MM/DD/YYYY"
            required
          />
        </View>
        <View style={styles.flex1}>
          <Input
            label="Period End"
            value={formData.endDate}
            onChangeText={(v) => updateField('endDate', v)}
            placeholder="MM/DD/YYYY"
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
          This is a preview with estimated taxes. Final document will have accurate calculations.
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
        
        {/* Bottom Actions */}
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primary,
  },
  progressDotCurrent: {
    backgroundColor: COLORS.primary,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  progressDotTextActive: {
    color: COLORS.primary,
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: SPACING.xl,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  templateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  templateEmoji: {
    fontSize: 24,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  templateDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  previewWebview: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginVertical: SPACING.md,
    minHeight: 400,
    ...SHADOWS.medium,
  },
  webview: {
    flex: 1,
  },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  previewNoteIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  previewNoteText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: '#92400e',
  },
  actions: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
