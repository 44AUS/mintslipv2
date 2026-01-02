import React, { useState, useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, KeyboardAvoidingView, Platform,
  TextInput, ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuth, API_URL } from '../context/AuthContext';

// US States
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
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }, { value: 'DC', label: 'DC' },
];

// Templates
const TEMPLATES = [
  { id: 'template-a', name: 'Gusto', icon: '💚', color: '#00a8a1' },
  { id: 'template-b', name: 'ADP', icon: '🔴', color: '#d0021b' },
  { id: 'template-c', name: 'Workday', icon: '🟠', color: '#f5811f' },
  { id: 'template-h', name: 'OnPay', icon: '🔵', color: '#2563eb' },
];

// Modern Input Component
const Input = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, required, editable = true }) => (
  <View style={styles.inputWrapper}>
    {label && (
      <Text style={styles.inputLabel}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
    )}
    <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={editable}
      />
    </View>
  </View>
);

// State Picker
const StatePicker = ({ label, value, onSelect, required }) => {
  const [showPicker, setShowPicker] = useState(false);
  const selected = US_STATES.find(s => s.value === value);
  
  return (
    <View style={styles.inputWrapper}>
      {label && (
        <Text style={styles.inputLabel}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TouchableOpacity 
        style={styles.inputContainer} 
        onPress={() => setShowPicker(!showPicker)}
      >
        <Text style={[styles.input, !value && { color: COLORS.textTertiary }]}>
          {selected?.label || 'Select State'}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {showPicker && (
        <View style={styles.pickerDropdown}>
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {US_STATES.map(state => (
              <TouchableOpacity
                key={state.value}
                style={[styles.pickerItem, value === state.value && styles.pickerItemSelected]}
                onPress={() => { onSelect(state.value); setShowPicker(false); }}
              >
                <Text style={[styles.pickerItemText, value === state.value && styles.pickerItemTextSelected]}>
                  {state.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function PaystubFormScreen({ navigation }) {
  const { token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [template, setTemplate] = useState('template-a');
  
  // Form data
  const [employee, setEmployee] = useState({
    name: '', ssn: '', address: '', city: '', state: '', zip: ''
  });
  
  const [company, setCompany] = useState({
    name: '', address: '', city: '', state: '', zip: '', phone: ''
  });
  
  const [pay, setPay] = useState({
    type: 'hourly', rate: '', salary: '', hours: '80', overtime: '0',
    frequency: 'biweekly', startDate: '', endDate: ''
  });

  // Update helpers
  const updateEmployee = (field, value) => setEmployee(prev => ({ ...prev, [field]: value }));
  const updateCompany = (field, value) => setCompany(prev => ({ ...prev, [field]: value }));
  const updatePay = (field, value) => setPay(prev => ({ ...prev, [field]: value }));

  // Calculate gross pay
  const getGrossPay = () => {
    if (pay.type === 'salary') {
      const annual = parseFloat(pay.salary) || 0;
      return annual / (pay.frequency === 'weekly' ? 52 : 26);
    }
    const rate = parseFloat(pay.rate) || 0;
    const hours = parseFloat(pay.hours) || 0;
    const ot = parseFloat(pay.overtime) || 0;
    return (rate * hours) + (rate * 1.5 * ot);
  };

  // Validation
  const canProceed = () => {
    switch (step) {
      case 1: return template;
      case 2: return employee.name && employee.address && employee.city && employee.state && employee.zip;
      case 3: return company.name && company.address && company.city && company.state && company.zip;
      case 4: return pay.type === 'salary' 
        ? pay.salary && pay.startDate && pay.endDate
        : pay.rate && pay.hours && pay.startDate && pay.endDate;
      default: return true;
    }
  };

  // Navigation
  const goNext = () => {
    if (!canProceed()) {
      Alert.alert('Missing Info', 'Please fill in all required fields');
      return;
    }
    if (step === 4) generatePreview();
    else setStep(step + 1);
  };

  const goBack = () => step > 1 ? setStep(step - 1) : navigation.goBack();

  // Generate preview
  const generatePreview = () => {
    setLoading(true);
    const gross = getGrossPay();
    const fed = gross * 0.12, state_tax = gross * 0.05, ss = gross * 0.062, med = gross * 0.0145;
    const net = gross - fed - state_tax - ss - med;
    const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tpl = TEMPLATES.find(t => t.id === template);
    
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;padding:16px;background:#f5f5f5;font-size:12px}
      .card{background:#fff;border-radius:12px;padding:20px;max-width:500px;margin:0 auto}
      .header{border-bottom:3px solid ${tpl.color};padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between}
      .logo{font-size:20px;font-weight:700;color:${tpl.color}}.company-name{font-weight:600;text-align:right;font-size:11px;color:#333}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .box{background:#fafafa;padding:10px;border-radius:8px;border:1px solid #eee}
      .box-title{font-size:10px;font-weight:600;color:${tpl.color};text-transform:uppercase;margin-bottom:6px}
      .row{display:flex;justify-content:space-between;font-size:11px;margin:3px 0}.lbl{color:#666}.val{font-weight:500}
      .total{border-top:2px solid ${tpl.color};padding-top:8px;margin-top:8px}
      .net{background:${tpl.color};color:#fff;padding:16px;border-radius:10px;text-align:center;margin-top:12px}
      .net-label{font-size:11px;opacity:0.9}.net-value{font-size:24px;font-weight:700}
      .watermark{text-align:center;color:#aaa;font-size:10px;margin-top:16px;padding-top:12px;border-top:1px dashed #ddd}</style></head>
      <body><div class="card">
        <div class="header"><div class="logo">${tpl.name}</div><div class="company-name">${company.name}<br>${company.city}, ${company.state}</div></div>
        <div class="grid">
          <div class="box"><div class="box-title">Employee</div>
            <div class="row"><span class="lbl">Name</span><span class="val">${employee.name}</span></div>
            <div class="row"><span class="lbl">SSN</span><span class="val">XXX-XX-${employee.ssn || 'XXXX'}</span></div>
            <div class="row"><span class="lbl">Location</span><span class="val">${employee.city}, ${employee.state}</span></div></div>
          <div class="box"><div class="box-title">Pay Period</div>
            <div class="row"><span class="lbl">Period</span><span class="val">${pay.startDate} - ${pay.endDate}</span></div>
            <div class="row"><span class="lbl">Frequency</span><span class="val">${pay.frequency === 'weekly' ? 'Weekly' : 'Bi-Weekly'}</span></div></div>
        </div>
        <div class="grid">
          <div class="box"><div class="box-title">Earnings</div>
            ${pay.type === 'hourly' 
              ? `<div class="row"><span class="lbl">Regular (${pay.hours}h)</span><span class="val">$${fmt(parseFloat(pay.rate)*parseFloat(pay.hours))}</span></div>
                 ${parseFloat(pay.overtime)>0?`<div class="row"><span class="lbl">OT (${pay.overtime}h)</span><span class="val">$${fmt(parseFloat(pay.rate)*1.5*parseFloat(pay.overtime))}</span></div>`:''}`
              : `<div class="row"><span class="lbl">Salary</span><span class="val">$${fmt(gross)}</span></div>`}
            <div class="row total"><span class="lbl" style="font-weight:600">Gross Pay</span><span class="val" style="color:${tpl.color}">$${fmt(gross)}</span></div></div>
          <div class="box"><div class="box-title">Deductions</div>
            <div class="row"><span class="lbl">Federal Tax</span><span class="val">$${fmt(fed)}</span></div>
            <div class="row"><span class="lbl">State Tax</span><span class="val">$${fmt(state_tax)}</span></div>
            <div class="row"><span class="lbl">Social Security</span><span class="val">$${fmt(ss)}</span></div>
            <div class="row"><span class="lbl">Medicare</span><span class="val">$${fmt(med)}</span></div></div>
        </div>
        <div class="net"><div class="net-label">Net Pay</div><div class="net-value">$${fmt(net)}</div></div>
        <div class="watermark">PREVIEW - Watermark removed in final</div>
      </div></body></html>`;
    
    setPreviewHtml(html);
    setStep(5);
    setLoading(false);
  };

  // Download
  const handleDownload = async () => {
    if (!isSubscribed) {
      Alert.alert('Payment Required', '$9.99 to download', [
        { text: 'Cancel' },
        { text: 'Pay', onPress: () => Alert.alert('PayPal', 'Use web for payments') }
      ]);
      return;
    }
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/user/subscription-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documentType: 'paystub', template, count: 1 })
      });
      
      const clean = previewHtml.replace(/<div class="watermark">.*?<\/div>/, '');
      const { uri } = await Print.printToFileAsync({ html: clean });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      Alert.alert('Success', 'Pay stub downloaded!');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  // Step renderers
  const renderTemplates = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose Template</Text>
      <Text style={styles.stepDesc}>Select your preferred payroll style</Text>
      
      <View style={styles.templates}>
        {TEMPLATES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.templateCard, template === t.id && styles.templateSelected]}
            onPress={() => setTemplate(t.id)}
          >
            <LinearGradient
              colors={[t.color, t.color + 'dd']}
              style={styles.templateIcon}
            >
              <Text style={styles.templateEmoji}>{t.icon}</Text>
            </LinearGradient>
            <Text style={styles.templateName}>{t.name}</Text>
            {template === t.id && (
              <View style={[styles.templateCheck, { backgroundColor: t.color }]}>
                <Text style={styles.templateCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmployee = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Employee Details</Text>
      <Text style={styles.stepDesc}>Enter employee information</Text>
      
      <Input label="Full Name" value={employee.name} onChangeText={v => updateEmployee('name', v)} placeholder="John Smith" required />
      <Input label="SSN (Last 4)" value={employee.ssn} onChangeText={v => updateEmployee('ssn', v)} placeholder="1234" keyboardType="numeric" maxLength={4} />
      <Input label="Street Address" value={employee.address} onChangeText={v => updateEmployee('address', v)} placeholder="123 Main St" required />
      
      <View style={styles.row}>
        <View style={styles.flex2}>
          <Input label="City" value={employee.city} onChangeText={v => updateEmployee('city', v)} placeholder="New York" required />
        </View>
        <View style={styles.flex1}>
          <StatePicker label="State" value={employee.state} onSelect={v => updateEmployee('state', v)} required />
        </View>
      </View>
      
      <Input label="ZIP Code" value={employee.zip} onChangeText={v => updateEmployee('zip', v)} placeholder="10001" keyboardType="numeric" maxLength={5} required />
    </View>
  );

  const renderCompany = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Company Details</Text>
      <Text style={styles.stepDesc}>Enter employer information</Text>
      
      <Input label="Company Name" value={company.name} onChangeText={v => updateCompany('name', v)} placeholder="Acme Corporation" required />
      <Input label="Street Address" value={company.address} onChangeText={v => updateCompany('address', v)} placeholder="456 Business Ave" required />
      
      <View style={styles.row}>
        <View style={styles.flex2}>
          <Input label="City" value={company.city} onChangeText={v => updateCompany('city', v)} placeholder="Los Angeles" required />
        </View>
        <View style={styles.flex1}>
          <StatePicker label="State" value={company.state} onSelect={v => updateCompany('state', v)} required />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Input label="ZIP Code" value={company.zip} onChangeText={v => updateCompany('zip', v)} placeholder="90001" keyboardType="numeric" maxLength={5} required />
        </View>
        <View style={styles.flex1}>
          <Input label="Phone" value={company.phone} onChangeText={v => updateCompany('phone', v)} placeholder="(555) 123-4567" keyboardType="phone-pad" />
        </View>
      </View>
    </View>
  );

  const renderPay = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pay Information</Text>
      <Text style={styles.stepDesc}>Enter earnings and pay period</Text>
      
      <View style={styles.payTypeRow}>
        {['hourly', 'salary'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.payTypeBtn, pay.type === type && styles.payTypeBtnActive]}
            onPress={() => updatePay('type', type)}
          >
            <Text style={[styles.payTypeText, pay.type === type && styles.payTypeTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {pay.type === 'hourly' ? (
        <>
          <Input label="Hourly Rate ($)" value={pay.rate} onChangeText={v => updatePay('rate', v)} placeholder="25.00" keyboardType="decimal-pad" required />
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Input label="Regular Hours" value={pay.hours} onChangeText={v => updatePay('hours', v)} placeholder="80" keyboardType="numeric" required />
            </View>
            <View style={styles.flex1}>
              <Input label="Overtime Hours" value={pay.overtime} onChangeText={v => updatePay('overtime', v)} placeholder="0" keyboardType="numeric" />
            </View>
          </View>
        </>
      ) : (
        <Input label="Annual Salary ($)" value={pay.salary} onChangeText={v => updatePay('salary', v)} placeholder="75000" keyboardType="decimal-pad" required />
      )}
      
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Input label="Period Start" value={pay.startDate} onChangeText={v => updatePay('startDate', v)} placeholder="2024-01-01" required />
        </View>
        <View style={styles.flex1}>
          <Input label="Period End" value={pay.endDate} onChangeText={v => updatePay('endDate', v)} placeholder="2024-01-14" required />
        </View>
      </View>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <Text style={styles.stepTitle}>Preview</Text>
      <View style={styles.previewCard}>
        <WebView source={{ html: previewHtml }} style={styles.webview} scalesPageToFit />
      </View>
      <View style={styles.previewNote}>
        <Text style={styles.previewNoteText}>⚠️ Preview only. Final PDF will be clean.</Text>
      </View>
    </View>
  );

  // Progress dots
  const ProgressDots = () => (
    <View style={styles.progress}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={styles.progressItem}>
          <View style={[styles.dot, step >= i && styles.dotActive, step === i && styles.dotCurrent]}>
            <Text style={[styles.dotText, step >= i && styles.dotTextActive]}>{step > i ? '✓' : i}</Text>
          </View>
          {i < 5 && <View style={[styles.line, step > i && styles.lineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay Stub</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ProgressDots />
      
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 1 && renderTemplates()}
          {step === 2 && renderEmployee()}
          {step === 3 && renderCompany()}
          {step === 4 && renderPay()}
          {step === 5 && renderPreview()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.primaryBtn, !canProceed() && step < 5 && styles.primaryBtnDisabled]}
          onPress={step === 5 ? handleDownload : goNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {step === 5 ? (isSubscribed ? 'Download PDF' : 'Pay $9.99 & Download') : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: COLORS.text },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text },
  progress: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border },
  dotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  dotCurrent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotText: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary },
  dotTextActive: { color: COLORS.primary },
  line: { width: 20, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  lineActive: { backgroundColor: COLORS.primary },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  stepDesc: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  
  // Templates
  templates: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  templateCard: { width: '47%', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, alignItems: 'center', borderWidth: 2, borderColor: COLORS.border, ...SHADOWS.sm },
  templateSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  templateIcon: { width: 56, height: 56, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  templateEmoji: { fontSize: 28 },
  templateName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  templateCheck: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  templateCheckText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  // Inputs
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  required: { color: COLORS.error },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, minHeight: 52 },
  inputDisabled: { backgroundColor: COLORS.background },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: SPACING.md },
  chevron: { fontSize: 10, color: COLORS.textTertiary, marginLeft: SPACING.sm },
  
  // Picker
  pickerDropdown: { position: 'absolute', top: 80, left: 0, right: 0, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, zIndex: 100, ...SHADOWS.md },
  pickerList: { maxHeight: 200 },
  pickerItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pickerItemSelected: { backgroundColor: COLORS.primarySoft },
  pickerItemText: { fontSize: FONT_SIZES.md, color: COLORS.text },
  pickerItemTextSelected: { color: COLORS.primary, fontWeight: '600' },
  
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  
  // Pay type
  payTypeRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  payTypeBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  payTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  payTypeText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  payTypeTextActive: { color: COLORS.primary },
  
  // Preview
  previewContainer: { flex: 1, padding: SPACING.lg },
  previewCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', minHeight: 400, ...SHADOWS.md },
  webview: { flex: 1 },
  previewNote: { backgroundColor: COLORS.warningSoft, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md },
  previewNoteText: { fontSize: FONT_SIZES.sm, color: '#92400e', textAlign: 'center' },
  
  // Bottom bar
  bottomBar: { padding: SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textInverse },
});
