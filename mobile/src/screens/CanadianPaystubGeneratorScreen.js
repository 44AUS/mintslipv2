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
import { showToast } from '../components/Toast';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

// Canadian Provinces
const CANADIAN_PROVINCES = [
  { label: 'Alberta', value: 'AB' },
  { label: 'British Columbia', value: 'BC' },
  { label: 'Manitoba', value: 'MB' },
  { label: 'New Brunswick', value: 'NB' },
  { label: 'Newfoundland and Labrador', value: 'NL' },
  { label: 'Northwest Territories', value: 'NT' },
  { label: 'Nova Scotia', value: 'NS' },
  { label: 'Nunavut', value: 'NU' },
  { label: 'Ontario', value: 'ON' },
  { label: 'Prince Edward Island', value: 'PE' },
  { label: 'Quebec', value: 'QC' },
  { label: 'Saskatchewan', value: 'SK' },
  { label: 'Yukon', value: 'YT' },
];

const PAY_FREQUENCIES = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-Weekly', value: 'biweekly' },
  { label: 'Semi-Monthly', value: 'semimonthly' },
  { label: 'Monthly', value: 'monthly' },
];

const MARITAL_STATUSES = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Common-Law', value: 'common_law' },
];

const TEMPLATES = [
  { label: 'Gusto Style', value: 'template-a' },
  { label: 'Workday Style', value: 'template-c' },
  { label: 'OnPay Style', value: 'template-h' },
];

export default function CanadianPaystubGeneratorScreen({ navigation }) {
  const { user, isAuthenticated, hasActiveSubscription } = useAuth();
  const scrollViewRef = useRef(null);

  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    template: true,
    employee: true,
    company: true,
    payInfo: true,
    payPeriod: false,
    taxes: false,
  });

  // Form data
  const [formData, setFormData] = useState({
    // Template
    selectedTemplate: 'template-a',
    // Employee Info
    name: '',
    sin: '',
    address: '',
    city: '',
    province: 'ON',
    postalCode: '',
    // Company Info
    company: '',
    companyAddress: '',
    companyCity: '',
    companyProvince: 'ON',
    companyPostalCode: '',
    companyPhone: '',
    // Pay Info
    payType: 'hourly',
    rate: '',
    annualSalary: '',
    payFrequency: 'biweekly',
    hours: '80',
    overtime: '',
    // Bank Info
    bankName: '',
    bank: '',
    // Pay Period
    startDate: '',
    endDate: '',
    payDate: '',
    // Tax Info
    maritalStatus: 'single',
    federalAllowances: '0',
    provincialAllowances: '0',
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatSIN = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 3);
    return cleaned;
  };

  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    if (cleaned.length > 0) formatted = '(' + cleaned.substring(0, 3);
    if (cleaned.length >= 3) formatted += ') ' + cleaned.substring(3, 6);
    if (cleaned.length >= 6) formatted += '-' + cleaned.substring(6, 10);
    return formatted;
  };

  const formatPostalCode = (text) => {
    const cleaned = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 3) return cleaned;
    return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
  };

  const calculatePrice = () => {
    return 9.99;
  };

  const handleGenerate = async () => {
    // Validation
    if (!formData.name || !formData.company || !formData.rate) {
      showToast('Please fill in required fields (Name, Company, Pay Rate)', 'error');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(true);

    try {
      // TODO: Implement actual PDF generation/payment flow
      showToast('Canadian pay stub generation coming soon!', 'info');
    } catch (error) {
      showToast(error.message || 'Failed to generate pay stub', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.slate[600]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Canadian Pay Stub</Text>
          <Text style={styles.headerFlag}>🇨🇦</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Page Title */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Canadian Paystub Generator 🍁</Text>
            <Text style={styles.pageSubtitle}>
              Generate pay stubs with provincial tax calculations
            </Text>
          </View>

          {/* Template Selection */}
          <View style={styles.section}>
            <SectionHeader
              title="Template"
              collapsible
              isExpanded={expandedSections.template}
              onToggle={() => toggleSection('template')}
            />
            {expandedSections.template && (
              <View style={styles.sectionContent}>
                <Select
                  label="Payroll Provider Style"
                  value={formData.selectedTemplate}
                  onValueChange={(v) => updateField('selectedTemplate', v)}
                  options={TEMPLATES}
                  required
                />
              </View>
            )}
          </View>

          {/* Employee Information */}
          <View style={styles.section}>
            <SectionHeader
              title="Employee Information"
              collapsible
              isExpanded={expandedSections.employee}
              onToggle={() => toggleSection('employee')}
            />
            {expandedSections.employee && (
              <View style={styles.sectionContent}>
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(v) => updateField('name', v)}
                  placeholder="Jean Tremblay"
                  autoCapitalize="words"
                  required
                  icon={<Ionicons name="person-outline" size={18} color={colors.slate[400]} />}
                />

                <Input
                  label="SIN (Last 3 digits)"
                  value={formData.sin}
                  onChangeText={(v) => updateField('sin', formatSIN(v))}
                  placeholder="123"
                  keyboardType="number-pad"
                  maxLength={3}
                  icon={<Ionicons name="shield-outline" size={18} color={colors.slate[400]} />}
                />

                <Input
                  label="Street Address"
                  value={formData.address}
                  onChangeText={(v) => updateField('address', v)}
                  placeholder="123 Rue Principale"
                  icon={<Ionicons name="location-outline" size={18} color={colors.slate[400]} />}
                />

                <View style={styles.row}>
                  <View style={styles.flex2}>
                    <Input
                      label="City"
                      value={formData.city}
                      onChangeText={(v) => updateField('city', v)}
                      placeholder="Toronto"
                    />
                  </View>
                  <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                    <Select
                      label="Province"
                      value={formData.province}
                      onValueChange={(v) => updateField('province', v)}
                      options={CANADIAN_PROVINCES}
                      placeholder="Select"
                    />
                  </View>
                </View>

                <Input
                  label="Postal Code"
                  value={formData.postalCode}
                  onChangeText={(v) => updateField('postalCode', formatPostalCode(v))}
                  placeholder="M5V 1A1"
                  autoCapitalize="characters"
                  maxLength={7}
                />
              </View>
            )}
          </View>

          {/* Company Information */}
          <View style={styles.section}>
            <SectionHeader
              title="Company Information"
              collapsible
              isExpanded={expandedSections.company}
              onToggle={() => toggleSection('company')}
            />
            {expandedSections.company && (
              <View style={styles.sectionContent}>
                <Input
                  label="Company Name"
                  value={formData.company}
                  onChangeText={(v) => updateField('company', v)}
                  placeholder="Maple Corp Inc."
                  required
                  icon={<Ionicons name="business-outline" size={18} color={colors.slate[400]} />}
                />

                <Input
                  label="Company Address"
                  value={formData.companyAddress}
                  onChangeText={(v) => updateField('companyAddress', v)}
                  placeholder="456 Commerce Ave"
                  icon={<Ionicons name="location-outline" size={18} color={colors.slate[400]} />}
                />

                <View style={styles.row}>
                  <View style={styles.flex2}>
                    <Input
                      label="City"
                      value={formData.companyCity}
                      onChangeText={(v) => updateField('companyCity', v)}
                      placeholder="Vancouver"
                    />
                  </View>
                  <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                    <Select
                      label="Province"
                      value={formData.companyProvince}
                      onValueChange={(v) => updateField('companyProvince', v)}
                      options={CANADIAN_PROVINCES}
                      placeholder="Select"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Postal Code"
                      value={formData.companyPostalCode}
                      onChangeText={(v) => updateField('companyPostalCode', formatPostalCode(v))}
                      placeholder="V6B 1A1"
                      autoCapitalize="characters"
                      maxLength={7}
                    />
                  </View>
                  <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                    <Input
                      label="Phone"
                      value={formData.companyPhone}
                      onChangeText={(v) => updateField('companyPhone', formatPhone(v))}
                      placeholder="(604) 555-1234"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Pay Information */}
          <View style={styles.section}>
            <SectionHeader
              title="Pay Information"
              collapsible
              isExpanded={expandedSections.payInfo}
              onToggle={() => toggleSection('payInfo')}
            />
            {expandedSections.payInfo && (
              <View style={styles.sectionContent}>
                {/* Pay Type Toggle */}
                <Text style={styles.label}>Pay Type</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      formData.payType === 'hourly' && styles.toggleButtonActive,
                    ]}
                    onPress={() => updateField('payType', 'hourly')}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        formData.payType === 'hourly' && styles.toggleTextActive,
                      ]}
                    >
                      Hourly
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      formData.payType === 'salary' && styles.toggleButtonActive,
                    ]}
                    onPress={() => updateField('payType', 'salary')}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        formData.payType === 'salary' && styles.toggleTextActive,
                      ]}
                    >
                      Salary
                    </Text>
                  </TouchableOpacity>
                </View>

                {formData.payType === 'hourly' ? (
                  <>
                    <Input
                      label="Hourly Rate (CAD $)"
                      value={formData.rate}
                      onChangeText={(v) => updateField('rate', v)}
                      placeholder="25.00"
                      keyboardType="decimal-pad"
                      required
                      icon={<Ionicons name="cash-outline" size={18} color={colors.slate[400]} />}
                    />
                    <View style={styles.row}>
                      <View style={styles.flex1}>
                        <Input
                          label="Regular Hours"
                          value={formData.hours}
                          onChangeText={(v) => updateField('hours', v)}
                          placeholder="80"
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                        <Input
                          label="Overtime Hours"
                          value={formData.overtime}
                          onChangeText={(v) => updateField('overtime', v)}
                          placeholder="0"
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <Input
                    label="Annual Salary (CAD $)"
                    value={formData.annualSalary}
                    onChangeText={(v) => updateField('annualSalary', v)}
                    placeholder="65000"
                    keyboardType="decimal-pad"
                    required
                    icon={<Ionicons name="cash-outline" size={18} color={colors.slate[400]} />}
                  />
                )}

                <Select
                  label="Pay Frequency"
                  value={formData.payFrequency}
                  onValueChange={(v) => updateField('payFrequency', v)}
                  options={PAY_FREQUENCIES}
                />

                <Input
                  label="Bank Name"
                  value={formData.bankName}
                  onChangeText={(v) => updateField('bankName', v)}
                  placeholder="TD Canada Trust"
                  icon={<Ionicons name="card-outline" size={18} color={colors.slate[400]} />}
                />

                <Input
                  label="Account (Last 4 digits)"
                  value={formData.bank}
                  onChangeText={(v) => updateField('bank', v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            )}
          </View>

          {/* Tax Information */}
          <View style={styles.section}>
            <SectionHeader
              title="Tax Information"
              subtitle="Optional - For accurate tax calculations"
              collapsible
              isExpanded={expandedSections.taxes}
              onToggle={() => toggleSection('taxes')}
            />
            {expandedSections.taxes && (
              <View style={styles.sectionContent}>
                <Select
                  label="Marital Status"
                  value={formData.maritalStatus}
                  onValueChange={(v) => updateField('maritalStatus', v)}
                  options={MARITAL_STATUSES}
                />

                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Federal Allowances"
                      value={formData.federalAllowances}
                      onChangeText={(v) => updateField('federalAllowances', v.replace(/\D/g, ''))}
                      placeholder="0"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={[styles.flex1, { marginLeft: spacing.md }]}>
                    <Input
                      label="Provincial Allowances"
                      value={formData.provincialAllowances}
                      onChangeText={(v) => updateField('provincialAllowances', v.replace(/\D/g, ''))}
                      placeholder="0"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Price Summary */}
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Canadian Pay Stub (1)</Text>
              <Text style={styles.priceValue}>${calculatePrice().toFixed(2)} USD</Text>
            </View>
            <View style={[styles.priceRow, styles.priceTotal]}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>${calculatePrice().toFixed(2)}</Text>
            </View>
          </View>

          {/* Generate Button */}
          <View style={styles.generateContainer}>
            {hasActiveSubscription() ? (
              <Button
                variant="accent"
                size="lg"
                onPress={handleGenerate}
                loading={isProcessing}
                icon={<Ionicons name="download-outline" size={20} color={colors.accent.foreground} />}
                iconPosition="left"
              >
                Download with Subscription
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={handleGenerate}
                loading={isProcessing}
                icon={<Ionicons name="card-outline" size={20} color={colors.primary.foreground} />}
                iconPosition="left"
              >
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
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  headerFlag: {
    fontSize: 20,
    marginLeft: spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
  },
  pageHeader: {
    marginBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.default,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  sectionContent: {
    marginTop: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate[700],
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.muted.default,
    borderRadius: borderRadius.base,
    padding: 4,
    marginBottom: spacing.base,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.base - 2,
  },
  toggleButtonActive: {
    backgroundColor: colors.background,
    ...shadows.sm,
  },
  toggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.muted.foreground,
  },
  toggleTextActive: {
    color: colors.primary.default,
  },
  priceSummary: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
  },
  priceValue: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
  },
  priceTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  priceTotalLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  priceTotalValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.default,
  },
  generateContainer: {
    marginTop: spacing.base,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  secureText: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    marginLeft: spacing.xs,
  },
});
