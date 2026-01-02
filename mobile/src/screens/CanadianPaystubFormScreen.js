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

// Canadian Provinces
const PROVINCES = [
  { value: 'AB', label: 'Alberta' }, { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' }, { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland' }, { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' }, { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' }, { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' }, { value: 'SK', label: 'Saskatchewan' }, { value: 'YT', label: 'Yukon' },
];

// Templates
const TEMPLATES = [
  { id: 'standard', name: 'Standard', icon: '🍁', color: '#DC2626', desc: 'Classic Canadian format' },
  { id: 'quebec', name: 'Quebec', icon: '⚜️', color: '#1D4ED8', desc: 'Quebec-specific with RRQ' },
];

// Input Component
const Input = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, required }) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.inputLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  </View>
);

// Province Picker
const ProvincePicker = ({ label, value, onSelect, required }) => {
  const [show, setShow] = useState(false);
  const selected = PROVINCES.find(p => p.value === value);
  
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.inputLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
      <TouchableOpacity style={styles.inputContainer} onPress={() => setShow(!show)}>
        <Text style={[styles.input, !value && { color: COLORS.textTertiary }]}>{selected?.label || 'Select'}</Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {show && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
            {PROVINCES.map(p => (
              <TouchableOpacity key={p.value} style={[styles.dropdownItem, value === p.value && styles.dropdownItemActive]} onPress={() => { onSelect(p.value); setShow(false); }}>
                <Text style={[styles.dropdownText, value === p.value && styles.dropdownTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default function CanadianPaystubFormScreen({ navigation }) {
  const { token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [template, setTemplate] = useState('standard');
  
  const [employee, setEmployee] = useState({ name: '', sin: '', address: '', city: '', province: 'ON', postal: '' });
  const [company, setCompany] = useState({ name: '', address: '', city: '', province: 'ON', postal: '' });
  const [pay, setPay] = useState({ type: 'hourly', rate: '', salary: '', hours: '80', overtime: '0', frequency: 'biweekly', startDate: '', endDate: '' });

  const updateEmployee = (f, v) => setEmployee(p => ({ ...p, [f]: v }));
  const updateCompany = (f, v) => setCompany(p => ({ ...p, [f]: v }));
  const updatePay = (f, v) => setPay(p => ({ ...p, [f]: v }));

  const getGrossPay = () => {
    if (pay.type === 'salary') return (parseFloat(pay.salary) || 0) / (pay.frequency === 'weekly' ? 52 : 26);
    return (parseFloat(pay.rate) || 0) * (parseFloat(pay.hours) || 0) + (parseFloat(pay.rate) || 0) * 1.5 * (parseFloat(pay.overtime) || 0);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return template;
      case 2: return employee.name && employee.address && employee.city && employee.province && employee.postal;
      case 3: return company.name && company.address && company.city && company.province && company.postal;
      case 4: return pay.type === 'salary' ? pay.salary && pay.startDate && pay.endDate : pay.rate && pay.hours && pay.startDate && pay.endDate;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canProceed()) { Alert.alert('Missing Info', 'Please fill all required fields'); return; }
    if (step === 4) generatePreview();
    else setStep(step + 1);
  };

  const goBack = () => step > 1 ? setStep(step - 1) : navigation.goBack();

  const generatePreview = () => {
    setLoading(true);
    const gross = getGrossPay();
    const cpp = gross * 0.0595, ei = gross * 0.0163, fedTax = gross * 0.15, provTax = gross * 0.05;
    const net = gross - cpp - ei - fedTax - provTax;
    const fmt = n => n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;padding:16px;background:#f5f5f5;font-size:12px}
      .card{background:#fff;border-radius:12px;padding:20px;max-width:500px;margin:0 auto}
      .header{border-bottom:3px solid #DC2626;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center}
      .logo{font-size:20px;font-weight:700;color:#DC2626;display:flex;align-items:center;gap:8px}
      .flag{font-size:24px}
      .title{font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .box{background:#fafafa;padding:10px;border-radius:8px;border:1px solid #eee}
      .box-title{font-size:10px;font-weight:600;color:#DC2626;text-transform:uppercase;margin-bottom:6px}
      .row{display:flex;justify-content:space-between;font-size:11px;margin:3px 0}.lbl{color:#666}.val{font-weight:500}
      .total{border-top:2px solid #DC2626;padding-top:8px;margin-top:8px}
      .net{background:#DC2626;color:#fff;padding:16px;border-radius:10px;text-align:center;margin-top:12px}
      .net-label{font-size:11px;opacity:0.9}.net-value{font-size:24px;font-weight:700}
      .watermark{text-align:center;color:#aaa;font-size:10px;margin-top:16px;padding-top:12px;border-top:1px dashed #ddd}</style></head>
      <body><div class="card">
        <div class="header"><div class="logo"><span class="flag">🍁</span>Pay Statement</div><div class="title">Relevé de paie</div></div>
        <div class="grid">
          <div class="box"><div class="box-title">Employee / Employé</div>
            <div class="row"><span class="lbl">Name</span><span class="val">${employee.name}</span></div>
            <div class="row"><span class="lbl">SIN</span><span class="val">XXX-XXX-${employee.sin || 'XXX'}</span></div>
            <div class="row"><span class="lbl">Location</span><span class="val">${employee.city}, ${employee.province}</span></div></div>
          <div class="box"><div class="box-title">Pay Period / Période</div>
            <div class="row"><span class="lbl">Period</span><span class="val">${pay.startDate} - ${pay.endDate}</span></div>
            <div class="row"><span class="lbl">Employer</span><span class="val">${company.name}</span></div></div>
        </div>
        <div class="grid">
          <div class="box"><div class="box-title">Earnings / Gains</div>
            ${pay.type === 'hourly' ? `<div class="row"><span class="lbl">Regular (${pay.hours}h)</span><span class="val">$${fmt(parseFloat(pay.rate)*parseFloat(pay.hours))}</span></div>` : `<div class="row"><span class="lbl">Salary</span><span class="val">$${fmt(gross)}</span></div>`}
            <div class="row total"><span class="lbl" style="font-weight:600">Gross / Brut</span><span class="val" style="color:#DC2626">$${fmt(gross)}</span></div></div>
          <div class="box"><div class="box-title">Deductions / Déductions</div>
            <div class="row"><span class="lbl">CPP/RPC</span><span class="val">$${fmt(cpp)}</span></div>
            <div class="row"><span class="lbl">EI/AE</span><span class="val">$${fmt(ei)}</span></div>
            <div class="row"><span class="lbl">Federal Tax</span><span class="val">$${fmt(fedTax)}</span></div>
            <div class="row"><span class="lbl">Provincial Tax</span><span class="val">$${fmt(provTax)}</span></div></div>
        </div>
        <div class="net"><div class="net-label">Net Pay / Salaire net</div><div class="net-value">$${fmt(net)}</div></div>
        <div class="watermark">PREVIEW - Watermark removed in final</div>
      </div></body></html>`;
    
    setPreviewHtml(html);
    setStep(5);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!isSubscribed) {
      Alert.alert('Payment Required', '$9.99 to download', [{ text: 'Cancel' }, { text: 'Pay', onPress: () => Alert.alert('PayPal', 'Use web for payments') }]);
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/user/subscription-download`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documentType: 'canadian-paystub', template, count: 1 })
      });
      const clean = previewHtml.replace(/<div class="watermark">.*?<\/div>/, '');
      const { uri } = await Print.printToFileAsync({ html: clean });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      Alert.alert('Success', 'Canadian pay stub downloaded!');
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  // Progress
  const Progress = () => (
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
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>🍁 Canadian Pay Stub</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <Progress />
      
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose Template</Text>
              <Text style={styles.stepDesc}>Select your preferred Canadian format</Text>
              <View style={styles.templates}>
                {TEMPLATES.map(t => (
                  <TouchableOpacity key={t.id} style={[styles.templateCard, template === t.id && styles.templateSelected]} onPress={() => setTemplate(t.id)}>
                    <LinearGradient colors={[t.color, t.color + 'dd']} style={styles.templateIcon}>
                      <Text style={styles.templateEmoji}>{t.icon}</Text>
                    </LinearGradient>
                    <Text style={styles.templateName}>{t.name}</Text>
                    <Text style={styles.templateDesc}>{t.desc}</Text>
                    {template === t.id && <View style={[styles.templateCheck, { backgroundColor: t.color }]}><Text style={styles.checkText}>✓</Text></View>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Employee Details</Text>
              <Text style={styles.stepDesc}>Enter employee information</Text>
              <Input label="Full Name" value={employee.name} onChangeText={v => updateEmployee('name', v)} placeholder="John Smith" required />
              <Input label="SIN (Last 3)" value={employee.sin} onChangeText={v => updateEmployee('sin', v)} placeholder="123" keyboardType="numeric" maxLength={3} />
              <Input label="Street Address" value={employee.address} onChangeText={v => updateEmployee('address', v)} placeholder="123 Main St" required />
              <View style={styles.row}>
                <View style={styles.flex2}><Input label="City" value={employee.city} onChangeText={v => updateEmployee('city', v)} placeholder="Toronto" required /></View>
                <View style={styles.flex1}><ProvincePicker label="Province" value={employee.province} onSelect={v => updateEmployee('province', v)} required /></View>
              </View>
              <Input label="Postal Code" value={employee.postal} onChangeText={v => updateEmployee('postal', v.toUpperCase())} placeholder="M5V 1A1" maxLength={7} required />
            </View>
          )}
          
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Company Details</Text>
              <Text style={styles.stepDesc}>Enter employer information</Text>
              <Input label="Company Name" value={company.name} onChangeText={v => updateCompany('name', v)} placeholder="Maple Corp Ltd." required />
              <Input label="Street Address" value={company.address} onChangeText={v => updateCompany('address', v)} placeholder="456 Business Ave" required />
              <View style={styles.row}>
                <View style={styles.flex2}><Input label="City" value={company.city} onChangeText={v => updateCompany('city', v)} placeholder="Vancouver" required /></View>
                <View style={styles.flex1}><ProvincePicker label="Province" value={company.province} onSelect={v => updateCompany('province', v)} required /></View>
              </View>
              <Input label="Postal Code" value={company.postal} onChangeText={v => updateCompany('postal', v.toUpperCase())} placeholder="V6B 1A1" maxLength={7} required />
            </View>
          )}
          
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Pay Information</Text>
              <Text style={styles.stepDesc}>Enter earnings details (CAD)</Text>
              <View style={styles.payTypeRow}>
                {['hourly', 'salary'].map(type => (
                  <TouchableOpacity key={type} style={[styles.payTypeBtn, pay.type === type && styles.payTypeBtnActive]} onPress={() => updatePay('type', type)}>
                    <Text style={[styles.payTypeText, pay.type === type && styles.payTypeTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {pay.type === 'hourly' ? (
                <>
                  <Input label="Hourly Rate (CAD)" value={pay.rate} onChangeText={v => updatePay('rate', v)} placeholder="25.00" keyboardType="decimal-pad" required />
                  <View style={styles.row}>
                    <View style={styles.flex1}><Input label="Regular Hours" value={pay.hours} onChangeText={v => updatePay('hours', v)} placeholder="80" keyboardType="numeric" required /></View>
                    <View style={styles.flex1}><Input label="Overtime Hours" value={pay.overtime} onChangeText={v => updatePay('overtime', v)} placeholder="0" keyboardType="numeric" /></View>
                  </View>
                </>
              ) : (
                <Input label="Annual Salary (CAD)" value={pay.salary} onChangeText={v => updatePay('salary', v)} placeholder="75000" keyboardType="decimal-pad" required />
              )}
              <View style={styles.row}>
                <View style={styles.flex1}><Input label="Period Start" value={pay.startDate} onChangeText={v => updatePay('startDate', v)} placeholder="2024-01-01" required /></View>
                <View style={styles.flex1}><Input label="Period End" value={pay.endDate} onChangeText={v => updatePay('endDate', v)} placeholder="2024-01-14" required /></View>
              </View>
            </View>
          )}
          
          {step === 5 && (
            <View style={styles.previewContainer}>
              <Text style={styles.stepTitle}>Preview</Text>
              <View style={styles.previewCard}><WebView source={{ html: previewHtml }} style={styles.webview} scalesPageToFit /></View>
              <View style={styles.previewNote}><Text style={styles.previewNoteText}>⚠️ Preview only. Final PDF will be clean.</Text></View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#DC2626' }]} onPress={step === 5 ? handleDownload : goNext} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{step === 5 ? (isSubscribed ? 'Download PDF' : 'Pay $9.99 & Download') : 'Continue'}</Text>}
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
  dotActive: { borderColor: '#DC2626', backgroundColor: '#FEE2E2' },
  dotCurrent: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  dotText: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary },
  dotTextActive: { color: '#DC2626' },
  line: { width: 20, height: 2, backgroundColor: COLORS.border, marginHorizontal: 4 },
  lineActive: { backgroundColor: '#DC2626' },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  stepDesc: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  templates: { gap: SPACING.md },
  templateCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: COLORS.border, ...SHADOWS.sm },
  templateSelected: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  templateIcon: { width: 48, height: 48, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  templateEmoji: { fontSize: 24 },
  templateName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  templateDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  templateCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  required: { color: COLORS.error },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, minHeight: 52 },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: SPACING.md },
  chevron: { fontSize: 10, color: COLORS.textTertiary },
  dropdown: { position: 'absolute', top: 80, left: 0, right: 0, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, zIndex: 100, ...SHADOWS.md },
  dropdownList: { maxHeight: 200 },
  dropdownItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownItemActive: { backgroundColor: '#FEE2E2' },
  dropdownText: { fontSize: FONT_SIZES.md, color: COLORS.text },
  dropdownTextActive: { color: '#DC2626', fontWeight: '600' },
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  payTypeRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  payTypeBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  payTypeBtnActive: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  payTypeText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textSecondary },
  payTypeTextActive: { color: '#DC2626' },
  previewContainer: { flex: 1, padding: SPACING.lg },
  previewCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', minHeight: 400, ...SHADOWS.md },
  webview: { flex: 1 },
  previewNote: { backgroundColor: '#FEF3C7', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md },
  previewNoteText: { fontSize: FONT_SIZES.sm, color: '#92400e', textAlign: 'center' },
  bottomBar: { padding: SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  primaryBtn: { paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  primaryBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#fff' },
});
