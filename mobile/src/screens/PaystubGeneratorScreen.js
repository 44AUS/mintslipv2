import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import SectionHeader from '../components/SectionHeader';
import PaystubPreview from '../components/PaystubPreview';
import { showToast } from '../components/Toast';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

// US States
const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
];

const PAY_FREQUENCIES = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-Weekly', value: 'biweekly' },
  { label: 'Semi-Monthly', value: 'semimonthly' },
  { label: 'Monthly', value: 'monthly' },
];

const FILING_STATUSES = [
  { label: 'Single', value: 'single' },
  { label: 'Married Filing Jointly', value: 'married' },
  { label: 'Married Filing Separately', value: 'married_separate' },
  { label: 'Head of Household', value: 'head_household' },
];

const TEMPLATES = [
  { label: 'Gusto Style', value: 'template-a' },
  { label: 'Workday Style', value: 'template-c' },
  { label: 'OnPay Style', value: 'template-h' },
];

export default function PaystubGeneratorScreen({ navigation }) {
  const { user, isAuthenticated, hasActiveSubscription } = useAuth();
  const scrollViewRef = useRef(null);

  const [expandedSections, setExpandedSections] = useState({
    template: true,
    employee: true,
    company: true,
    payInfo: true,
    taxes: false,
  });

  const [formData, setFormData] = useState({
    selectedTemplate: 'template-a',
    name: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    company: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyZip: '',
    companyPhone: '',
    payType: 'hourly',
    rate: '',
    annualSalary: '',
    payFrequency: 'biweekly',
    hours: '80',
    overtime: '',
    bankName: '',
    bank: '',
    startDate: '',
    endDate: '',
    payDate: '',
    federalFilingStatus: 'single',
    stateAllowances: '0',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatSSN = (text) => text.replace(/\D/g, '').slice(0, 4);
  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length > 0) formatted = '(' + cleaned.substring(0, 3);
    if (cleaned.length >= 3) formatted += ') ' + cleaned.substring(3, 6);
    if (cleaned.length >= 6) formatted += '-' + cleaned.substring(6, 10);
    return formatted;
  };
  const formatZip = (text) => text.replace(/\D/g, '').slice(0, 5);

  const calculatePrice = () => 9.99;

  const handleGenerate = async () => {
    if (!formData.name || !formData.company || (!formData.rate && !formData.annualSalary)) {
      showToast('Please fill in required fields (Name, Company, Pay Rate)', 'error');
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(true);
    try {
      showToast('Pay stub generation coming soon!', 'info');
    } catch (error) {
      showToast(error.message || 'Failed to generate pay stub', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.slate[600]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>US Pay Stub</Text>
          <Text style={styles.headerFlag}>🇺🇸</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Document Preview */}
          <View style={styles.previewSection}>
            <View style={styles.previewLabelRow}>
              <Ionicons name="document-text" size={20} color={colors.primary.light} />
              <Text style={styles.previewSectionTitle}>Live Document Preview</Text>
            </View>
            <PaystubPreview data={formData} type="us" />
          </View>

          {/* Page Title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Instant Paystub Generator</Text>
            <Text style={styles.pageSubtitle}>Generate professional pay stubs with accurate tax calculations</Text>
          </View>

          {/* Template Selection */}
          <View style={styles.section}>
            <SectionHeader title="Template" collapsible isExpanded={expandedSections.template} onToggle={() => toggleSection('template')} />
            {expandedSections.template && (
              <View style={styles.sectionContent}>
                <Select label="Payroll Provider Style" value={formData.selectedTemplate} onValueChange={(v) => updateField('selectedTemplate', v)} options={TEMPLATES} required />
              </View>
            )}
          </View>

          {/* Employee Information */}
          <View style={styles.section}>
            <SectionHeader title="Employee Information" collapsible isExpanded={expandedSections.employee} onToggle={() => toggleSection('employee')} />
            {expandedSections.employee && (
              <View style={styles.sectionContent}>
                <Input label="Full Name" value={formData.name} onChangeText={(v) => updateField('name', v)} placeholder="John Doe" autoCapitalize="words" required icon={<Ionicons name="person-outline" size={18} color={colors.slate[400]} />} />
                <Input label="SSN (Last 4 digits)" value={formData.ssn} onChangeText={(v) => updateField('ssn', formatSSN(v))} placeholder="1234" keyboardType="number-pad" maxLength={4} icon={<Ionicons name="shield-outline" size={18} color={colors.slate[400]} />} />
                <Input label="Street Address" value={formData.address} onChangeText={(v) => updateField('address', v)} placeholder="123 Main St" icon={<Ionicons name="location-outline" size={18} color={colors.slate[400]} />} />
                <View style={styles.row}>
                  <View style={styles.flex2}>
                    <Input label="City" value={formData.city} onChangeText={(v) => updateField('city', v)} placeholder="New York" />
                  </View>
                  <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                    <Select label="State" value={formData.state} onValueChange={(v) => updateField('state', v)} options={US_STATES} placeholder="Select" />
                  </View>
                </View>
                <Input label="ZIP Code" value={formData.zip} onChangeText={(v) => updateField('zip', formatZip(v))} placeholder="10001" keyboardType="number-pad" maxLength={5} />
              </View>
            )}
          </View>

          {/* Company Information */}
          <View style={styles.section}>
            <SectionHeader title="Company Information" collapsible isExpanded={expandedSections.company} onToggle={() => toggleSection('company')} />
            {expandedSections.company && (
              <View style={styles.sectionContent}>
                <Input label="Company Name" value={formData.company} onChangeText={(v) => updateField('company', v)} placeholder="Acme Corporation" required icon={<Ionicons name="business-outline" size={18} color={colors.slate[400]} />} />
                <Input label="Company Address" value={formData.companyAddress} onChangeText={(v) => updateField('companyAddress', v)} placeholder="456 Corporate Blvd" icon={<Ionicons name="location-outline" size={18} color={colors.slate[400]} />} />
                <View style={styles.row}>
                  <View style={styles.flex2}>
                    <Input label="City" value={formData.companyCity} onChangeText={(v) => updateField('companyCity', v)} placeholder="San Francisco" />
                  </View>
                  <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                    <Select label="State" value={formData.companyState} onValueChange={(v) => updateField('companyState', v)} options={US_STATES} placeholder="Select" />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input label="ZIP Code" value={formData.companyZip} onChangeText={(v) => updateField('companyZip', formatZip(v))} placeholder="94102" keyboardType="number-pad" maxLength={5} />
                  </View>
                  <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                    <Input label="Phone" value={formData.companyPhone} onChangeText={(v) => updateField('companyPhone', formatPhone(v))} placeholder="(555) 123-4567" keyboardType="phone-pad" />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Pay Information */}
          <View style={styles.section}>
            <SectionHeader title="Pay Information" collapsible isExpanded={expandedSections.payInfo} onToggle={() => toggleSection('payInfo')} />
            {expandedSections.payInfo && (
              <View style={styles.sectionContent}>
                <Text style={styles.label}>Pay Type</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity style={[styles.toggleButton, formData.payType === 'hourly' && styles.toggleButtonActive]} onPress={() => updateField('payType', 'hourly')}>
                    <Text style={[styles.toggleText, formData.payType === 'hourly' && styles.toggleTextActive]}>Hourly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.toggleButton, formData.payType === 'salary' && styles.toggleButtonActive]} onPress={() => updateField('payType', 'salary')}>
                    <Text style={[styles.toggleText, formData.payType === 'salary' && styles.toggleTextActive]}>Salary</Text>
                  </TouchableOpacity>
                </View>

                {formData.payType === 'hourly' ? (
                  <>
                    <Input label="Hourly Rate ($)" value={formData.rate} onChangeText={(v) => updateField('rate', v)} placeholder="25.00" keyboardType="decimal-pad" required icon={<Ionicons name="cash-outline" size={18} color={colors.slate[400]} />} />
                    <View style={styles.row}>
                      <View style={styles.flex1}>
                        <Input label="Regular Hours" value={formData.hours} onChangeText={(v) => updateField('hours', v)} placeholder="80" keyboardType="number-pad" />
                      </View>
                      <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                        <Input label="Overtime Hours" value={formData.overtime} onChangeText={(v) => updateField('overtime', v)} placeholder="0" keyboardType="number-pad" />
                      </View>
                    </View>
                  </>
                ) : (
                  <Input label="Annual Salary ($)" value={formData.annualSalary} onChangeText={(v) => updateField('annualSalary', v)} placeholder="65000" keyboardType="decimal-pad" required icon={<Ionicons name="cash-outline" size={18} color={colors.slate[400]} />} />
                )}

                <Select label="Pay Frequency" value={formData.payFrequency} onValueChange={(v) => updateField('payFrequency', v)} options={PAY_FREQUENCIES} />
                <Input label="Bank Name" value={formData.bankName} onChangeText={(v) => updateField('bankName', v)} placeholder="Chase Bank" icon={<Ionicons name="card-outline" size={18} color={colors.slate[400]} />} />
                <Input label="Account (Last 4 digits)" value={formData.bank} onChangeText={(v) => updateField('bank', v.replace(/\D/g, '').slice(0, 4))} placeholder="1234" keyboardType="number-pad" maxLength={4} />
              </View>
            )}
          </View>

          {/* Tax Information */}
          <View style={styles.section}>
            <SectionHeader title="Tax Information" subtitle="Optional - For accurate calculations" collapsible isExpanded={expandedSections.taxes} onToggle={() => toggleSection('taxes')} />
            {expandedSections.taxes && (
              <View style={styles.sectionContent}>
                <Select label="Federal Filing Status" value={formData.federalFilingStatus} onValueChange={(v) => updateField('federalFilingStatus', v)} options={FILING_STATUSES} />
                <Input label="State Allowances" value={formData.stateAllowances} onChangeText={(v) => updateField('stateAllowances', v.replace(/\D/g, ''))} placeholder="0" keyboardType="number-pad" />
              </View>
            )}
          </View>

          {/* Price Summary */}
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Pay Stub (1)</Text>
              <Text style={styles.priceValue}>${calculatePrice().toFixed(2)}</Text>
            </View>
            <View style={[styles.priceRow, styles.priceTotal]}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>${calculatePrice().toFixed(2)}</Text>
            </View>
          </View>

          {/* Generate Button */}
          <View style={styles.generateContainer}>
            {hasActiveSubscription() ? (
              <Button variant="accent" size="lg" onPress={handleGenerate} loading={isProcessing} icon={<Ionicons name="download-outline" size={20} color={colors.accent.foreground} />} iconPosition="left">
                Download with Subscription
              </Button>
            ) : (
              <Button variant="primary" size="lg" onPress={handleGenerate} loading={isProcessing} icon={<Ionicons name="card-outline" size={20} color={colors.primary.foreground} />} iconPosition="left">
                Pay ${calculatePrice().toFixed(2)} & Generate
              </Button>
            )}
            <View style={styles.secureNote}>
              <Ionicons name="lock-closed" size={14} color={colors.muted.foreground} />
              <Text style={styles.secureText}>Secured by Stripe</Text>
            </View>
          </View>

          <View style={{ height: spacing['3xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.foreground },
  headerFlag: { fontSize: 20, marginLeft: spacing.sm },
  keyboardView: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { padding: spacing.base },
  previewCard: { backgroundColor: colors.background, borderRadius: borderRadius.xl, padding: spacing.base, marginBottom: spacing.base, borderWidth: 2, borderColor: colors.primary.light, ...shadows.md },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.primary.default, marginLeft: spacing.sm },
  previewContent: {},
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  previewLabel: { fontSize: typography.fontSize.sm, color: colors.muted.foreground },
  previewValue: { fontSize: typography.fontSize.sm, color: colors.foreground, fontWeight: typography.fontWeight.medium },
  previewValueBold: { fontSize: typography.fontSize.lg, color: colors.foreground, fontWeight: typography.fontWeight.bold },
  previewDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  previewSubSection: { backgroundColor: colors.muted.default, borderRadius: borderRadius.base, padding: spacing.sm, marginVertical: spacing.xs },
  previewSubTitle: { fontSize: typography.fontSize.xs, color: colors.muted.foreground, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.xs, textTransform: 'uppercase' },
  previewLabelSmall: { fontSize: typography.fontSize.xs, color: colors.muted.foreground },
  previewValueSmall: { fontSize: typography.fontSize.xs, color: colors.red[500] },
  previewLabelNet: { fontSize: typography.fontSize.base, color: colors.foreground, fontWeight: typography.fontWeight.semibold },
  previewValueNet: { fontSize: typography.fontSize.xl, color: colors.primary.light, fontWeight: typography.fontWeight.bold },
  pageHeader: { marginBottom: spacing.xl },
  pageTitle: { fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.primary.default, marginBottom: spacing.xs },
  pageSubtitle: { fontSize: typography.fontSize.base, color: colors.muted.foreground },
  section: { backgroundColor: colors.background, borderRadius: borderRadius.xl, padding: spacing.base, marginBottom: spacing.base, ...shadows.sm },
  sectionContent: { marginTop: spacing.md },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.slate[700], marginBottom: spacing.sm },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  toggleContainer: { flexDirection: 'row', backgroundColor: colors.muted.default, borderRadius: borderRadius.base, padding: 4, marginBottom: spacing.base },
  toggleButton: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.base - 2 },
  toggleButtonActive: { backgroundColor: colors.background, ...shadows.sm },
  toggleText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.muted.foreground },
  toggleTextActive: { color: colors.primary.default },
  priceSummary: { backgroundColor: colors.background, borderRadius: borderRadius.xl, padding: spacing.base, marginBottom: spacing.base, ...shadows.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  priceLabel: { fontSize: typography.fontSize.base, color: colors.muted.foreground },
  priceValue: { fontSize: typography.fontSize.base, color: colors.foreground },
  priceTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm, marginBottom: 0 },
  priceTotalLabel: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.foreground },
  priceTotalValue: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.primary.default },
  generateContainer: { marginTop: spacing.base },
  secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  secureText: { fontSize: typography.fontSize.sm, color: colors.muted.foreground, marginLeft: spacing.xs },
});
