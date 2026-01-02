import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Select, Header, RadioGroup } from '../components/ui';
import { useAuth, API_URL } from '../context/AuthContext';
import { CA_PROVINCES, PAY_FREQUENCIES, CANADIAN_TEMPLATES } from '../constants/formData';

// Custom Input component with proper state handling
const FormInput = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, required, editable = true, multiline, style }) => {
  return (
    <View style={[inputStyles.inputContainer, style]}>
      {label && (
        <Text style={inputStyles.inputLabel}>
          {label}
          {required && <Text style={inputStyles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          inputStyles.textInput,
          multiline && inputStyles.textInputMultiline,
          !editable && inputStyles.textInputDisabled,
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

const inputStyles = StyleSheet.create({
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

export default function CanadianPaystubFormScreen({ navigation }) {
  const { user, token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('template-h');
  
  const [formData, setFormData] = useState({
    // Employee Information
    name: '',
    sin: '',
    address: '',
    city: '',
    province: 'ON',
    postalCode: '',
    hireDate: '',
    
    // Company Information
    company: '',
    companyAddress: '',
    companyCity: '',
    companyProvince: 'ON',
    companyPostalCode: '',
    companyPhone: '',
    
    // Pay Information
    payType: 'hourly',
    rate: '',
    annualSalary: '',
    payFrequency: 'biweekly',
    
    // Pay Period
    startDate: '',
    endDate: '',
    hours: '80',
    overtime: '0',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return selectedTemplate !== '';
      case 2:
        return formData.name && formData.address && formData.city && formData.province && formData.postalCode;
      case 3:
        return formData.company && formData.companyAddress && formData.companyCity && formData.companyProvince && formData.companyPostalCode;
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

  const createPreviewHtml = (grossPay) => {
    // Canadian tax estimates
    const cpp = grossPay * 0.0595; // CPP
    const ei = grossPay * 0.0163; // EI
    const federalTax = grossPay * 0.15; // Estimated federal
    const provincialTax = grossPay * 0.05; // Estimated provincial
    const totalDeductions = cpp + ei + federalTax + provincialTax;
    const netPay = grossPay - totalDeductions;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 15px; margin-bottom: 15px; }
          .company { font-size: 24px; font-weight: bold; color: #dc2626; }
          .title { font-size: 14px; color: #666; margin-top: 5px; }
          .flag { font-size: 20px; margin-right: 8px; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .label { color: #666; }
          .value { font-weight: 500; }
          .total { font-size: 18px; color: #dc2626; font-weight: bold; }
          .watermark { text-align: center; color: #999; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company"><span class="flag">🇨🇦</span>${formData.company || 'Company Name'}</div>
            <div class="title">PAY STATEMENT / RELEVÉ DE PAIE</div>
          </div>
          
          <div class="section">
            <div class="section-title">Employee Information</div>
            <div class="row"><span class="label">Name:</span><span class="value">${formData.name || 'Employee Name'}</span></div>
            <div class="row"><span class="label">Address:</span><span class="value">${formData.address}, ${formData.city}, ${formData.province} ${formData.postalCode}</span></div>
            <div class="row"><span class="label">SIN:</span><span class="value">XXX-XXX-${formData.sin || 'XXX'}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Pay Period / Période de paie</div>
            <div class="row"><span class="label">Period:</span><span class="value">${formData.startDate} - ${formData.endDate}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Earnings / Gains</div>
            ${formData.payType === 'hourly' ? `
              <div class="row"><span class="label">Regular (${formData.hours} hrs @ $${formData.rate}):</span><span class="value">$${(parseFloat(formData.rate) * parseFloat(formData.hours)).toFixed(2)}</span></div>
            ` : `
              <div class="row"><span class="label">Salary:</span><span class="value">$${grossPay.toFixed(2)}</span></div>
            `}
            <div class="row"><span class="label">Gross Pay / Salaire brut:</span><span class="value total">$${grossPay.toFixed(2)}</span></div>
          </div>
          
          <div class="section">
            <div class="section-title">Deductions / Déductions</div>
            <div class="row"><span class="label">CPP/RPC:</span><span class="value">$${cpp.toFixed(2)}</span></div>
            <div class="row"><span class="label">EI/AE:</span><span class="value">$${ei.toFixed(2)}</span></div>
            <div class="row"><span class="label">Federal Tax:</span><span class="value">$${federalTax.toFixed(2)}</span></div>
            <div class="row"><span class="label">Provincial Tax:</span><span class="value">$${provincialTax.toFixed(2)}</span></div>
            <div class="row"><span class="label">Total Deductions:</span><span class="value">$${totalDeductions.toFixed(2)}</span></div>
          </div>
          
          <div class="section">
            <div class="row"><span class="label" style="font-size: 18px;">Net Pay / Salaire net:</span><span class="value total">$${netPay.toFixed(2)}</span></div>
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
        'Pay $9.99 to download your Canadian pay stub.',
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
          documentType: 'canadian-paystub',
          template: selectedTemplate,
          count: 1,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Download failed');
      }
      
      await generateAndSharePdf();
      Alert.alert('Success', 'Canadian pay stub downloaded successfully!');
      
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
        dialogTitle: 'Save Canadian Pay Stub',
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>🇨🇦 Canadian Pay Stub</Text>
            <Text style={styles.stepDescription}>Select template style</Text>
            
            {CANADIAN_TEMPLATES.map((template) => (
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
      case 2:
        return (
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
              label="SIN (Last 3 digits)"
              value={formData.sin}
              onChangeText={(v) => updateField('sin', v)}
              placeholder="XXX"
              keyboardType="numeric"
              maxLength={3}
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
                  placeholder="Toronto"
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Select
                  label="Province"
                  value={formData.province}
                  onValueChange={(v) => updateField('province', v)}
                  options={CA_PROVINCES}
                  required
                />
              </View>
            </View>
            
            <FormInput
              label="Postal Code"
              value={formData.postalCode}
              onChangeText={(v) => updateField('postalCode', v.toUpperCase())}
              placeholder="M5V 1A1"
              maxLength={7}
              required
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Employer Information</Text>
            <Text style={styles.stepDescription}>Enter company details</Text>
            
            <FormInput
              label="Company Name"
              value={formData.company}
              onChangeText={(v) => updateField('company', v)}
              placeholder="Maple Corp Ltd."
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
                  placeholder="Vancouver"
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Select
                  label="Province"
                  value={formData.companyProvince}
                  onValueChange={(v) => updateField('companyProvince', v)}
                  options={CA_PROVINCES}
                  required
                />
              </View>
            </View>
            
            <FormInput
              label="Postal Code"
              value={formData.companyPostalCode}
              onChangeText={(v) => updateField('companyPostalCode', v.toUpperCase())}
              placeholder="V6B 1A1"
              maxLength={7}
              required
            />
          </View>
        );
      case 4:
        return (
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
                <Input
                  label="Hourly Rate (CAD)"
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
                label="Annual Salary (CAD)"
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
                  placeholder="YYYY-MM-DD"
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Period End"
                  value={formData.endDate}
                  onChangeText={(v) => updateField('endDate', v)}
                  placeholder="YYYY-MM-DD"
                  required
                />
              </View>
            </View>
          </View>
        );
      case 5:
        return (
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
                Preview with estimated Canadian taxes. Final document will have accurate calculations.
              </Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

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
        title="Canadian Pay Stub"
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
              style={{ backgroundColor: '#dc2626' }}
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
  progressDotActive: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  progressDotCurrent: { backgroundColor: '#dc2626' },
  progressDotText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  progressDotTextActive: { color: '#dc2626' },
  progressLine: { width: 24, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  progressLineActive: { backgroundColor: '#dc2626' },
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
  templateCardSelected: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  templateIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  templateEmoji: { fontSize: 24 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.textPrimary },
  templateDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  checkmark: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#dc2626',
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
});
