import React, { useState } from 'react';
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

// US States (abbreviated)
const STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'IL', label: 'Illinois' }, { value: 'NY', label: 'New York' },
  { value: 'TX', label: 'Texas' }, { value: 'WA', label: 'Washington' }, { value: 'DC', label: 'DC' },
];

// Input Component
const Input = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, required }) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.inputLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
    <View style={styles.inputContainer}>
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.textTertiary} keyboardType={keyboardType} maxLength={maxLength} />
    </View>
  </View>
);

// State Picker
const StatePicker = ({ label, value, onSelect, required }) => {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.inputLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
      <TouchableOpacity style={styles.inputContainer} onPress={() => setShow(!show)}>
        <Text style={[styles.input, !value && { color: COLORS.textTertiary }]}>{STATES.find(s => s.value === value)?.label || 'Select'}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {show && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
            {STATES.map(s => (
              <TouchableOpacity key={s.value} style={[styles.dropdownItem, value === s.value && styles.dropdownItemActive]} onPress={() => { onSelect(s.value); setShow(false); }}>
                <Text style={[styles.dropdownText, value === s.value && styles.dropdownTextActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function W2FormScreen({ navigation }) {
  const { token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  
  const [employee, setEmployee] = useState({ name: '', ssn: '', address: '', city: '', state: '', zip: '' });
  const [employer, setEmployer] = useState({ name: '', ein: '', address: '', city: '', state: '', zip: '' });
  const [wages, setWages] = useState({ year: new Date().getFullYear().toString(), box1: '', box2: '', box3: '', box4: '', box5: '', box6: '', box16: '', box17: '' });

  const updateEmployee = (f, v) => setEmployee(p => ({ ...p, [f]: v }));
  const updateEmployer = (f, v) => setEmployer(p => ({ ...p, [f]: v }));
  const updateWages = (f, v) => setWages(p => ({ ...p, [f]: v }));

  const canProceed = () => {
    switch (step) {
      case 1: return employee.name && employee.ssn && employee.address && employee.city && employee.state && employee.zip;
      case 2: return employer.name && employer.ein && employer.address && employer.city && employer.state && employer.zip;
      case 3: return wages.box1 && wages.box2;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canProceed()) { Alert.alert('Missing Info', 'Please fill all required fields'); return; }
    if (step === 3) generatePreview();
    else setStep(step + 1);
  };

  const goBack = () => step > 1 ? setStep(step - 1) : navigation.goBack();

  const generatePreview = () => {
    setLoading(true);
    const fmt = n => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const b1 = parseFloat(wages.box1) || 0;
    
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;padding:12px;background:#f5f5f5;font-size:10px}
      .card{background:#fff;border-radius:8px;padding:16px;max-width:500px;margin:0 auto;border:2px solid #1D4ED8}
      .header{text-align:center;border-bottom:2px solid #1D4ED8;padding-bottom:10px;margin-bottom:12px}
      .title{font-size:14px;font-weight:700;color:#1D4ED8}.subtitle{font-size:9px;color:#666;margin-top:2px}
      .year{font-size:28px;font-weight:800;color:#1D4ED8;margin-top:4px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
      .box{border:1px solid #ddd;padding:8px;background:#fafafa;border-radius:4px}
      .box-label{font-size:8px;color:#666;margin-bottom:2px}.box-value{font-weight:600;font-size:11px;color:#333}
      .full{grid-column:1/-1}
      .watermark{text-align:center;color:#aaa;font-size:9px;margin-top:12px;padding-top:8px;border-top:1px dashed #ddd}</style></head>
      <body><div class="card">
        <div class="header">
          <div class="title">Form W-2 Wage and Tax Statement</div>
          <div class="subtitle">Copy B - To Be Filed With Employee's FEDERAL Tax Return</div>
          <div class="year">${wages.year}</div>
        </div>
        <div class="grid">
          <div class="box"><div class="box-label">a Employee's SSN</div><div class="box-value">XXX-XX-${employee.ssn.slice(-4) || 'XXXX'}</div></div>
          <div class="box"><div class="box-label">b Employer's EIN</div><div class="box-value">${employer.ein}</div></div>
          <div class="box full"><div class="box-label">c Employer's name, address</div><div class="box-value">${employer.name}<br>${employer.address}, ${employer.city}, ${employer.state} ${employer.zip}</div></div>
          <div class="box"><div class="box-label">1 Wages, tips, compensation</div><div class="box-value">$${fmt(wages.box1)}</div></div>
          <div class="box"><div class="box-label">2 Federal income tax withheld</div><div class="box-value">$${fmt(wages.box2)}</div></div>
          <div class="box"><div class="box-label">3 Social security wages</div><div class="box-value">$${fmt(wages.box3 || b1)}</div></div>
          <div class="box"><div class="box-label">4 Social security tax</div><div class="box-value">$${fmt(wages.box4 || b1 * 0.062)}</div></div>
          <div class="box"><div class="box-label">5 Medicare wages</div><div class="box-value">$${fmt(wages.box5 || b1)}</div></div>
          <div class="box"><div class="box-label">6 Medicare tax</div><div class="box-value">$${fmt(wages.box6 || b1 * 0.0145)}</div></div>
          <div class="box full"><div class="box-label">e Employee's name, address</div><div class="box-value">${employee.name}<br>${employee.address}, ${employee.city}, ${employee.state} ${employee.zip}</div></div>
          <div class="box"><div class="box-label">16 State wages</div><div class="box-value">$${fmt(wages.box16 || b1)}</div></div>
          <div class="box"><div class="box-label">17 State income tax</div><div class="box-value">$${fmt(wages.box17)}</div></div>
        </div>
        <div class="watermark">PREVIEW - Watermark removed in final</div>
      </div></body></html>`;
    
    setPreviewHtml(html);
    setStep(4);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!isSubscribed) {
      Alert.alert('Payment Required', '$14.99 to download', [{ text: 'Cancel' }, { text: 'Pay', onPress: () => Alert.alert('PayPal', 'Use web for payments') }]);
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/user/subscription-download`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documentType: 'w2', count: 1 })
      });
      const clean = previewHtml.replace(/<div class="watermark">.*?<\/div>/, '');
      const { uri } = await Print.printToFileAsync({ html: clean });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      Alert.alert('Success', 'W-2 form downloaded!');
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  // Progress
  const Progress = () => (
    <View style={styles.progress}>
      {[1,2,3,4].map(i => (
        <View key={i} style={styles.progressItem}>
          <View style={[styles.dot, step >= i && styles.dotActive, step === i && styles.dotCurrent]}>
            <Text style={[styles.dotText, step >= i && styles.dotTextActive]}>{step > i ? '✓' : i}</Text>
          </View>
          {i < 4 && <View style={[styles.line, step > i && styles.lineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>📋 W-2 Form</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <Progress />
      
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Employee Information</Text>
              <Text style={styles.stepDesc}>Enter employee details for the W-2</Text>
              <Input label="Full Name" value={employee.name} onChangeText={v => updateEmployee('name', v)} placeholder="John Smith" required />
              <Input label="Social Security Number" value={employee.ssn} onChangeText={v => updateEmployee('ssn', v)} placeholder="XXX-XX-XXXX" required />
              <Input label="Street Address" value={employee.address} onChangeText={v => updateEmployee('address', v)} placeholder="123 Main St" required />
              <View style={styles.row}>
                <View style={styles.flex2}><Input label="City" value={employee.city} onChangeText={v => updateEmployee('city', v)} placeholder="New York" required /></View>
                <View style={styles.flex1}><StatePicker label="State" value={employee.state} onSelect={v => updateEmployee('state', v)} required /></View>
              </View>
              <Input label="ZIP Code" value={employee.zip} onChangeText={v => updateEmployee('zip', v)} placeholder="10001" keyboardType="numeric" maxLength={5} required />
            </View>
          )}
          
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Employer Information</Text>
              <Text style={styles.stepDesc}>Enter company details</Text>
              <Input label="Company Name" value={employer.name} onChangeText={v => updateEmployer('name', v)} placeholder="Acme Corporation" required />
              <Input label="EIN" value={employer.ein} onChangeText={v => updateEmployer('ein', v)} placeholder="XX-XXXXXXX" required />
              <Input label="Street Address" value={employer.address} onChangeText={v => updateEmployer('address', v)} placeholder="456 Business Ave" required />
              <View style={styles.row}>
                <View style={styles.flex2}><Input label="City" value={employer.city} onChangeText={v => updateEmployer('city', v)} placeholder="Los Angeles" required /></View>
                <View style={styles.flex1}><StatePicker label="State" value={employer.state} onSelect={v => updateEmployer('state', v)} required /></View>
              </View>
              <Input label="ZIP Code" value={employer.zip} onChangeText={v => updateEmployer('zip', v)} placeholder="90001" keyboardType="numeric" maxLength={5} required />
            </View>
          )}
          
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Wage & Tax Data</Text>
              <Text style={styles.stepDesc}>Enter W-2 box amounts</Text>
              <Input label="Tax Year" value={wages.year} onChangeText={v => updateWages('year', v)} placeholder="2024" keyboardType="numeric" maxLength={4} />
              <View style={styles.row}>
                <View style={styles.flex1}><Input label="Box 1: Wages" value={wages.box1} onChangeText={v => updateWages('box1', v)} placeholder="50000" keyboardType="decimal-pad" required /></View>
                <View style={styles.flex1}><Input label="Box 2: Federal Tax" value={wages.box2} onChangeText={v => updateWages('box2', v)} placeholder="6000" keyboardType="decimal-pad" required /></View>
              </View>
              <View style={styles.row}>
                <View style={styles.flex1}><Input label="Box 3: SS Wages" value={wages.box3} onChangeText={v => updateWages('box3', v)} placeholder="Auto" keyboardType="decimal-pad" /></View>
                <View style={styles.flex1}><Input label="Box 4: SS Tax" value={wages.box4} onChangeText={v => updateWages('box4', v)} placeholder="Auto" keyboardType="decimal-pad" /></View>
              </View>
              <View style={styles.row}>
                <View style={styles.flex1}><Input label="Box 16: State Wages" value={wages.box16} onChangeText={v => updateWages('box16', v)} placeholder="Auto" keyboardType="decimal-pad" /></View>
                <View style={styles.flex1}><Input label="Box 17: State Tax" value={wages.box17} onChangeText={v => updateWages('box17', v)} placeholder="2500" keyboardType="decimal-pad" /></View>
              </View>
            </View>
          )}
          
          {step === 4 && (
            <View style={styles.previewContainer}>
              <Text style={styles.stepTitle}>Preview</Text>
              <View style={styles.previewCard}><WebView source={{ html: previewHtml }} style={styles.webview} scalesPageToFit /></View>
              <View style={styles.previewNote}><Text style={styles.previewNoteText}>⚠️ Preview only. Final PDF will be clean.</Text></View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#1D4ED8' }]} onPress={step === 4 ? handleDownload : goNext} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{step === 4 ? (isSubscribed ? 'Download PDF' : 'Pay $14.99 & Download') : 'Continue'}</Text>}
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
  dotActive: { borderColor: '#1D4ED8', backgroundColor: '#DBEAFE' },
  dotCurrent: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  dotText: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary },
  dotTextActive: { color: '#1D4ED8' },
  line: { width: 28, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  lineActive: { backgroundColor: '#1D4ED8' },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  stepDesc: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  required: { color: COLORS.error },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, minHeight: 52 },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: SPACING.md },
  chevron: { fontSize: 10, color: COLORS.textTertiary },
  dropdown: { position: 'absolute', top: 80, left: 0, right: 0, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, zIndex: 100, ...SHADOWS.md },
  dropdownList: { maxHeight: 200 },
  dropdownItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownItemActive: { backgroundColor: '#DBEAFE' },
  dropdownText: { fontSize: FONT_SIZES.md, color: COLORS.text },
  dropdownTextActive: { color: '#1D4ED8', fontWeight: '600' },
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  previewContainer: { flex: 1, padding: SPACING.lg },
  previewCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', minHeight: 400, ...SHADOWS.md },
  webview: { flex: 1 },
  previewNote: { backgroundColor: '#FEF3C7', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md },
  previewNoteText: { fontSize: FONT_SIZES.sm, color: '#92400e', textAlign: 'center' },
  bottomBar: { padding: SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  primaryBtn: { paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  primaryBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#fff' },
});
