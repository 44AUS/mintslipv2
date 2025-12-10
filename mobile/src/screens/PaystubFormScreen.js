import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Checkbox from '../components/Checkbox';
import RadioGroup from '../components/RadioGroup';
import PayPalWebView from '../components/PayPalWebView';
import { generateAndDownloadPaystub } from '../utils/paystubGenerator';

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' }, { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' }, { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' }, { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' }, { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' }, { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' }, { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' }, { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' }, { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' }, { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' }, { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' }, { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' }, { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' }, { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' }, { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' }, { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' }, { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
];

export default function PaystubFormScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('template-a');
  
  const [formData, setFormData] = useState({
    name: '',
    ssn: '',
    bank: '',
    bankName: '',
    address: '',
    city: '',
    state: 'CA',
    zip: '',
    company: '',
    companyAddress: '',
    companyCity: '',
    companyState: 'CA',
    companyZip: '',
    companyPhone: '',
    hireDate: '',
    startDate: '',
    endDate: '',
    rate: '',
    payFrequency: 'biweekly',
    payDay: 'Friday',
    hoursList: '',
    overtimeList: '',
    includeLocalTax: true,
  });

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const calculateNumStubs = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const periodLength = formData.payFrequency === 'biweekly' ? 14 : 7;
    return Math.ceil(diffDays / periodLength);
  }, [formData.startDate, formData.endDate, formData.payFrequency]);

  const preview = useMemo(() => {
    const rate = parseFloat(formData.rate) || 0;
    const numStubs = calculateNumStubs;
    const defaultHours = formData.payFrequency === 'weekly' ? 40 : 80;
    const hoursArray = formData.hoursList
      .split(',')
      .map((h) => parseFloat(h.trim()) || 0)
      .slice(0, numStubs) || [];
    const overtimeArray = formData.overtimeList
      .split(',')
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

    return { totalGross, totalTaxes, netPay, numStubs };
  }, [formData, calculateNumStubs]);

  const handlePayment = () => {
    // Validate required fields
    if (!formData.name || !formData.company || !formData.rate || !formData.startDate || !formData.endDate) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    setShowPayPal(true);
  };

  const onPaymentSuccess = async () => {
    setShowPayPal(false);
    setIsProcessing(true);
    
    try {
      await generateAndDownloadPaystub(formData, selectedTemplate, calculateNumStubs, (progress) => {
        console.log(`Generation progress: ${(progress * 100).toFixed(0)}%`);
      });
      
      Alert.alert('Success', 'Pay stub(s) generated successfully!', [
        { text: 'OK', onPress: () => setIsProcessing(false) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate document. Please try again.');
      setIsProcessing(false);
    }
  };

  const onPaymentError = (error) => {
    setShowPayPal(false);
    Alert.alert('Payment Failed', error || 'Please try again');
  };

  const onPaymentCancel = () => {
    setShowPayPal(false);
  };

  const totalAmount = calculateNumStubs * 10;

  return (
    <View style={styles.container}>
      <Header title="Generate Pay Stub" showBack={true} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Template Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Template</Text>
          <RadioGroup
            options={[
              { label: 'Template A - Classic Professional', value: 'template-a' },
              { label: 'Template B - Modern Minimalist', value: 'template-b' },
              { label: 'Template C - Detailed Corporate', value: 'template-c' },
            ]}
            value={selectedTemplate}
            onValueChange={setSelectedTemplate}
          />
        </View>

        {/* Employee Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <Input
            label="Full Name *"
            value={formData.name}
            onChangeText={(v) => updateField('name', v)}
            placeholder="John Doe"
          />
          <Input
            label="SSN (Last 4 digits)"
            value={formData.ssn}
            onChangeText={(v) => updateField('ssn', v)}
            placeholder="1234"
            keyboardType="numeric"
          />
          <Input
            label="Address"
            value={formData.address}
            onChangeText={(v) => updateField('address', v)}
            placeholder="123 Main St"
          />
          <Input
            label="City"
            value={formData.city}
            onChangeText={(v) => updateField('city', v)}
            placeholder="Los Angeles"
          />
          <Select
            label="State"
            value={formData.state}
            onValueChange={(v) => updateField('state', v)}
            items={US_STATES}
          />
          <Input
            label="ZIP Code"
            value={formData.zip}
            onChangeText={(v) => updateField('zip', v)}
            placeholder="90001"
            keyboardType="numeric"
          />
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <Input
            label="Company Name *"
            value={formData.company}
            onChangeText={(v) => updateField('company', v)}
            placeholder="Acme Corp"
          />
          <Input
            label="Company Address"
            value={formData.companyAddress}
            onChangeText={(v) => updateField('companyAddress', v)}
            placeholder="456 Business Ave"
          />
          <Input
            label="City"
            value={formData.companyCity}
            onChangeText={(v) => updateField('companyCity', v)}
            placeholder="Los Angeles"
          />
          <Select
            label="State"
            value={formData.companyState}
            onValueChange={(v) => updateField('companyState', v)}
            items={US_STATES}
          />
          <Input
            label="ZIP Code"
            value={formData.companyZip}
            onChangeText={(v) => updateField('companyZip', v)}
            placeholder="90001"
            keyboardType="numeric"
          />
          <Input
            label="Phone"
            value={formData.companyPhone}
            onChangeText={(v) => updateField('companyPhone', v)}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        {/* Pay Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pay Period</Text>
          <Input
            label="Start Date *"
            value={formData.startDate}
            onChangeText={(v) => updateField('startDate', v)}
            placeholder="YYYY-MM-DD"
          />
          <Input
            label="End Date *"
            value={formData.endDate}
            onChangeText={(v) => updateField('endDate', v)}
            placeholder="YYYY-MM-DD"
          />
          <Select
            label="Pay Frequency"
            value={formData.payFrequency}
            onValueChange={(v) => updateField('payFrequency', v)}
            items={[
              { label: 'Weekly', value: 'weekly' },
              { label: 'Bi-Weekly', value: 'biweekly' },
            ]}
          />
          <Select
            label="Pay Day"
            value={formData.payDay}
            onValueChange={(v) => updateField('payDay', v)}
            items={[
              { label: 'Monday', value: 'Monday' },
              { label: 'Tuesday', value: 'Tuesday' },
              { label: 'Wednesday', value: 'Wednesday' },
              { label: 'Thursday', value: 'Thursday' },
              { label: 'Friday', value: 'Friday' },
            ]}
          />
        </View>

        {/* Pay Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pay Details</Text>
          <Input
            label="Hourly Rate *"
            value={formData.rate}
            onChangeText={(v) => updateField('rate', v)}
            placeholder="25.00"
            keyboardType="decimal-pad"
          />
          <Input
            label="Hours List (comma-separated)"
            value={formData.hoursList}
            onChangeText={(v) => updateField('hoursList', v)}
            placeholder="80, 80, 80"
          />
          <Input
            label="Overtime Hours (comma-separated)"
            value={formData.overtimeList}
            onChangeText={(v) => updateField('overtimeList', v)}
            placeholder="0, 5, 0"
          />
        </View>

        {/* Banking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banking</Text>
          <Input
            label="Bank Name"
            value={formData.bankName}
            onChangeText={(v) => updateField('bankName', v)}
            placeholder="Chase Bank"
          />
          <Input
            label="Account # (Last 4 digits)"
            value={formData.bank}
            onChangeText={(v) => updateField('bank', v)}
            placeholder="1234"
            keyboardType="numeric"
          />
        </View>

        {/* Tax Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Options</Text>
          <Checkbox
            label="Include Local Tax (1%)"
            value={formData.includeLocalTax}
            onValueChange={(v) => updateField('includeLocalTax', v)}
          />
        </View>

        {/* Preview */}
        {calculateNumStubs > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Summary</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Number of Stubs:</Text>
              <Text style={styles.previewValue}>{calculateNumStubs}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Gross Pay:</Text>
              <Text style={styles.previewValue}>${preview.totalGross.toFixed(2)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Deductions:</Text>
              <Text style={styles.previewValue}>${preview.totalTaxes.toFixed(2)}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Total Net Pay:</Text>
              <Text style={[styles.previewValue, styles.netPayValue]}>${preview.netPay.toFixed(2)}</Text>
            </View>
            <View style={[styles.previewRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Pay Button */}
        <Button
          title={`Pay $${totalAmount.toFixed(2)} with PayPal`}
          onPress={handlePayment}
          disabled={calculateNumStubs === 0 || isProcessing}
          style={styles.payButton}
        />

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#1a4731" />
            <Text style={styles.processingText}>Generating your documents...</Text>
          </View>
        )}
      </ScrollView>

      <PayPalWebView
        visible={showPayPal}
        amount={totalAmount}
        description={`Pay Stub Generation (${calculateNumStubs} stub${calculateNumStubs > 1 ? 's' : ''})`}
        onSuccess={onPaymentSuccess}
        onError={onPaymentError}
        onCancel={onPaymentCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a4731',
    marginBottom: 16,
  },
  previewSection: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4731',
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  previewLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  netPayValue: {
    color: '#1a4731',
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#1a4731',
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a4731',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4731',
  },
  payButton: {
    marginBottom: 40,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
});
