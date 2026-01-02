import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, SafeAreaView, Alert, 
  KeyboardAvoidingView, Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Input, Select, Header } from '../components/ui';
import { useAuth, API_URL } from '../context/AuthContext';
import { US_STATES } from '../constants/formData';

export default function W2FormScreen({ navigation }) {
  const { token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  
  const [formData, setFormData] = useState({
    // Employee Info
    employeeName: '',
    employeeSSN: '',
    employeeAddress: '',
    employeeCity: '',
    employeeState: '',
    employeeZip: '',
    
    // Employer Info
    employerName: '',
    employerEIN: '',
    employerAddress: '',
    employerCity: '',
    employerState: '',
    employerZip: '',
    
    // Tax Year
    taxYear: new Date().getFullYear().toString(),
    
    // Wage & Tax Data
    box1: '', // Wages, tips, other compensation
    box2: '', // Federal income tax withheld
    box3: '', // Social security wages
    box4: '', // Social security tax withheld
    box5: '', // Medicare wages and tips
    box6: '', // Medicare tax withheld
    box16: '', // State wages
    box17: '', // State income tax
    box18: '', // Local wages
    box19: '', // Local income tax
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.employeeName && formData.employeeSSN && formData.employeeAddress;
      case 2:
        return formData.employerName && formData.employerEIN && formData.employerAddress;
      case 3:
        return formData.box1 && formData.box2;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    if (currentStep < 4) {
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
      const html = createPreviewHtml();
      setPreviewHtml(html);
      setCurrentStep(4);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const createPreviewHtml = () => {
    const formatMoney = (val) => {
      const num = parseFloat(val) || 0;
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 15px; background: #f5f5f5; font-size: 12px; }
          .container { background: white; padding: 15px; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 2px solid #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .title { font-size: 16px; font-weight: bold; }
          .subtitle { font-size: 11px; color: #666; }
          .year { font-size: 24px; font-weight: bold; color: #2563eb; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .box { border: 1px solid #333; padding: 8px; background: #fafafa; }
          .box-label { font-size: 9px; color: #666; margin-bottom: 2px; }
          .box-value { font-weight: bold; font-size: 13px; }
          .full-width { grid-column: 1 / -1; }
          .watermark { text-align: center; color: #999; font-size: 10px; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">Form W-2 Wage and Tax Statement</div>
            <div class="subtitle">Copy B - To Be Filed With Employee's FEDERAL Tax Return</div>
            <div class="year">${formData.taxYear}</div>
          </div>
          
          <div class="grid">
            <div class="box">
              <div class="box-label">a Employee's social security number</div>
              <div class="box-value">XXX-XX-${formData.employeeSSN?.slice(-4) || 'XXXX'}</div>
            </div>
            <div class="box">
              <div class="box-label">b Employer identification number (EIN)</div>
              <div class="box-value">${formData.employerEIN || 'XX-XXXXXXX'}</div>
            </div>
            
            <div class="box full-width">
              <div class="box-label">c Employer's name, address, and ZIP code</div>
              <div class="box-value">${formData.employerName}<br/>${formData.employerAddress}<br/>${formData.employerCity}, ${formData.employerState} ${formData.employerZip}</div>
            </div>
            
            <div class="box">
              <div class="box-label">1 Wages, tips, other compensation</div>
              <div class="box-value">$${formatMoney(formData.box1)}</div>
            </div>
            <div class="box">
              <div class="box-label">2 Federal income tax withheld</div>
              <div class="box-value">$${formatMoney(formData.box2)}</div>
            </div>
            
            <div class="box">
              <div class="box-label">3 Social security wages</div>
              <div class="box-value">$${formatMoney(formData.box3 || formData.box1)}</div>
            </div>
            <div class="box">
              <div class="box-label">4 Social security tax withheld</div>
              <div class="box-value">$${formatMoney(formData.box4 || (parseFloat(formData.box1) * 0.062))}</div>
            </div>
            
            <div class="box">
              <div class="box-label">5 Medicare wages and tips</div>
              <div class="box-value">$${formatMoney(formData.box5 || formData.box1)}</div>
            </div>
            <div class="box">
              <div class="box-label">6 Medicare tax withheld</div>
              <div class="box-value">$${formatMoney(formData.box6 || (parseFloat(formData.box1) * 0.0145))}</div>
            </div>
            
            <div class="box full-width">
              <div class="box-label">e Employee's name, address, and ZIP code</div>
              <div class="box-value">${formData.employeeName}<br/>${formData.employeeAddress}<br/>${formData.employeeCity}, ${formData.employeeState} ${formData.employeeZip}</div>
            </div>
            
            <div class="box">
              <div class="box-label">16 State wages, tips, etc.</div>
              <div class="box-value">$${formatMoney(formData.box16 || formData.box1)}</div>
            </div>
            <div class="box">
              <div class="box-label">17 State income tax</div>
              <div class="box-value">$${formatMoney(formData.box17)}</div>
            </div>
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
        'Pay $14.99 to download your W-2 form.',
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
        body: JSON.stringify({ documentType: 'w2', count: 1 }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Download failed');
      }
      
      await generateAndSharePdf();
      Alert.alert('Success', 'W-2 form downloaded successfully!');
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndSharePdf = async () => {
    const html = createPreviewHtml().replace(
      '<div class="watermark">PREVIEW - Watermark will be removed in final document</div>',
      ''
    );
    
    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save W-2 Form' });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>📋 Employee Information</Text>
            <Text style={styles.stepDescription}>Enter employee details for the W-2</Text>
            
            <Input
              label="Employee Full Name"
              value={formData.employeeName}
              onChangeText={(v) => updateField('employeeName', v)}
              placeholder="John Smith"
              required
            />
            
            <Input
              label="Social Security Number"
              value={formData.employeeSSN}
              onChangeText={(v) => updateField('employeeSSN', v)}
              placeholder="XXX-XX-XXXX"
              keyboardType="numeric"
              maxLength={11}
              required
            />
            
            <Input
              label="Street Address"
              value={formData.employeeAddress}
              onChangeText={(v) => updateField('employeeAddress', v)}
              placeholder="123 Main St"
              required
            />
            
            <View style={styles.row}>
              <View style={styles.flex2}>
                <Input
                  label="City"
                  value={formData.employeeCity}
                  onChangeText={(v) => updateField('employeeCity', v)}
                  placeholder="New York"
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Select
                  label="State"
                  value={formData.employeeState}
                  onValueChange={(v) => updateField('employeeState', v)}
                  options={US_STATES}
                  required
                />
              </View>
            </View>
            
            <Input
              label="ZIP Code"
              value={formData.employeeZip}
              onChangeText={(v) => updateField('employeeZip', v)}
              placeholder="10001"
              keyboardType="numeric"
              maxLength={5}
              required
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>🏢 Employer Information</Text>
            <Text style={styles.stepDescription}>Enter employer details</Text>
            
            <Input
              label="Employer/Company Name"
              value={formData.employerName}
              onChangeText={(v) => updateField('employerName', v)}
              placeholder="Acme Corporation"
              required
            />
            
            <Input
              label="Employer Identification Number (EIN)"
              value={formData.employerEIN}
              onChangeText={(v) => updateField('employerEIN', v)}
              placeholder="XX-XXXXXXX"
              required
            />
            
            <Input
              label="Employer Address"
              value={formData.employerAddress}
              onChangeText={(v) => updateField('employerAddress', v)}
              placeholder="456 Business Ave"
              required
            />
            
            <View style={styles.row}>
              <View style={styles.flex2}>
                <Input
                  label="City"
                  value={formData.employerCity}
                  onChangeText={(v) => updateField('employerCity', v)}
                  placeholder="Los Angeles"
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Select
                  label="State"
                  value={formData.employerState}
                  onValueChange={(v) => updateField('employerState', v)}
                  options={US_STATES}
                  required
                />
              </View>
            </View>
            
            <Input
              label="ZIP Code"
              value={formData.employerZip}
              onChangeText={(v) => updateField('employerZip', v)}
              placeholder="90001"
              keyboardType="numeric"
              maxLength={5}
              required
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>💰 Wage & Tax Data</Text>
            <Text style={styles.stepDescription}>Enter wage and tax withholding amounts</Text>
            
            <Input
              label="Tax Year"
              value={formData.taxYear}
              onChangeText={(v) => updateField('taxYear', v)}
              placeholder="2024"
              keyboardType="numeric"
              maxLength={4}
            />
            
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Box 1: Wages"
                  value={formData.box1}
                  onChangeText={(v) => updateField('box1', v)}
                  placeholder="50000"
                  keyboardType="decimal-pad"
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Box 2: Federal Tax"
                  value={formData.box2}
                  onChangeText={(v) => updateField('box2', v)}
                  placeholder="6000"
                  keyboardType="decimal-pad"
                  required
                />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Box 3: SS Wages"
                  value={formData.box3}
                  onChangeText={(v) => updateField('box3', v)}
                  placeholder="Auto-fill from Box 1"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Box 4: SS Tax"
                  value={formData.box4}
                  onChangeText={(v) => updateField('box4', v)}
                  placeholder="Auto-calculate"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Box 16: State Wages"
                  value={formData.box16}
                  onChangeText={(v) => updateField('box16', v)}
                  placeholder="Auto-fill from Box 1"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Box 17: State Tax"
                  value={formData.box17}
                  onChangeText={(v) => updateField('box17', v)}
                  placeholder="2500"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.previewContainer}>
            <Text style={styles.stepTitle}>Preview</Text>
            <View style={styles.previewWebview}>
              <WebView source={{ html: previewHtml }} style={styles.webview} scalesPageToFit={true} />
            </View>
            <View style={styles.previewNote}>
              <Text style={styles.previewNoteIcon}>⚠️</Text>
              <Text style={styles.previewNoteText}>Preview with sample data. Verify all information before downloading.</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderProgress = () => (
    <View style={styles.progress}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressItem}>
          <View style={[
            styles.progressDot,
            currentStep >= step && styles.progressDotActive,
            currentStep === step && styles.progressDotCurrent,
          ]}>
            <Text style={[styles.progressDotText, currentStep >= step && styles.progressDotTextActive]}>
              {currentStep > step ? '✓' : step}
            </Text>
          </View>
          {step < 4 && (
            <View style={[styles.progressLine, currentStep > step && styles.progressLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="W-2 Form Generator" showBack onBack={handleBack} variant="light" />
      
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {renderProgress()}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {renderStepContent()}
        </ScrollView>
        
        <View style={styles.actions}>
          {currentStep < 4 ? (
            <Button variant="primary" size="lg" fullWidth onPress={currentStep === 3 ? generatePreview : handleNext} loading={isLoading} style={{ backgroundColor: '#2563eb' }}>
              {currentStep === 3 ? 'Generate Preview' : 'Continue'}
            </Button>
          ) : (
            <Button variant="primary" size="lg" fullWidth onPress={handleDownload} loading={isLoading} style={{ backgroundColor: '#2563eb' }}>
              {isSubscribed ? 'Download (Subscription)' : 'Pay $14.99 & Download'}
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
  progressDotActive: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  progressDotCurrent: { backgroundColor: '#2563eb' },
  progressDotText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  progressDotTextActive: { color: '#2563eb' },
  progressLine: { width: 32, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  progressLineActive: { backgroundColor: '#2563eb' },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  stepDescription: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
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
  actions: { padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
});
