import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, KeyboardAvoidingView, Platform,
  TextInput, ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAuth, API_URL } from '../context/AuthContext';

// Templates
const TEMPLATES = [
  { id: 'ats', name: 'ATS Optimized', icon: '📄', color: '#1D4ED8', desc: 'Passes applicant tracking systems' },
  { id: 'modern', name: 'Modern', icon: '✨', color: '#059669', desc: 'Contemporary professional design' },
  { id: 'classic', name: 'Classic', icon: '📋', color: '#1E293B', desc: 'Traditional executive style' },
];

// Input
const Input = ({ label, value, onChangeText, placeholder, keyboardType, multiline, required }) => (
  <View style={styles.inputWrapper}>
    {label && <Text style={styles.inputLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>}
    <View style={[styles.inputContainer, multiline && { minHeight: 100, alignItems: 'flex-start' }]}>
      <TextInput style={[styles.input, multiline && { textAlignVertical: 'top', paddingTop: SPACING.md }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.textTertiary} keyboardType={keyboardType} multiline={multiline} numberOfLines={multiline ? 4 : 1} />
    </View>
  </View>
);

export default function ResumeBuilderScreen({ navigation }) {
  const { token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [template, setTemplate] = useState('ats');
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Form data
  const [personal, setPersonal] = useState({ name: '', email: '', phone: '', location: '', linkedin: '', website: '' });
  const [work, setWork] = useState([{ id: 1, company: '', title: '', location: '', start: '', end: '', current: false, bullets: [''] }]);
  const [edu, setEdu] = useState([{ id: 1, school: '', degree: '', field: '', date: '', gpa: '' }]);
  const [skills, setSkills] = useState(['']);
  const [jobDesc, setJobDesc] = useState('');

  // Handlers
  const updatePersonal = (f, v) => setPersonal(p => ({ ...p, [f]: v }));
  
  const addWork = () => setWork(p => [...p, { id: Date.now(), company: '', title: '', location: '', start: '', end: '', current: false, bullets: [''] }]);
  const removeWork = id => work.length > 1 && setWork(p => p.filter(w => w.id !== id));
  const updateWork = (id, f, v) => setWork(p => p.map(w => w.id === id ? { ...w, [f]: v } : w));
  const addBullet = id => setWork(p => p.map(w => w.id === id ? { ...w, bullets: [...w.bullets, ''] } : w));
  const updateBullet = (id, i, v) => setWork(p => p.map(w => w.id === id ? { ...w, bullets: w.bullets.map((b, idx) => idx === i ? v : b) } : w));
  const removeBullet = (id, i) => setWork(p => p.map(w => w.id === id && w.bullets.length > 1 ? { ...w, bullets: w.bullets.filter((_, idx) => idx !== i) } : w));
  
  const addEdu = () => setEdu(p => [...p, { id: Date.now(), school: '', degree: '', field: '', date: '', gpa: '' }]);
  const removeEdu = id => edu.length > 1 && setEdu(p => p.filter(e => e.id !== id));
  const updateEdu = (id, f, v) => setEdu(p => p.map(e => e.id === id ? { ...e, [f]: v } : e));
  
  const addSkill = () => setSkills(p => [...p, '']);
  const updateSkill = (i, v) => setSkills(p => p.map((s, idx) => idx === i ? v : s));
  const removeSkill = i => skills.length > 1 && setSkills(p => p.filter((_, idx) => idx !== i));

  // Upload Resume
  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] });
      if (result.canceled) return;
      
      const file = result.assets[0];
      if (file.size > 10 * 1024 * 1024) { Alert.alert('Error', 'File must be under 10MB'); return; }
      
      setParsing(true);
      setUploadedFile(file.name);
      
      const formData = new FormData();
      formData.append('file', { uri: file.uri, type: file.mimeType, name: file.name });
      
      const res = await fetch(`${API_URL}/api/parse-resume`, { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } });
      if (!res.ok) throw new Error('Failed to parse');
      
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        setPersonal({ name: d.personalInfo?.fullName || '', email: d.personalInfo?.email || '', phone: d.personalInfo?.phone || '', location: d.personalInfo?.location || '', linkedin: d.personalInfo?.linkedin || '', website: d.personalInfo?.website || '' });
        if (d.workExperience?.length) setWork(d.workExperience.map((w, i) => ({ id: i + 1, company: w.company || '', title: w.position || '', location: w.location || '', start: w.startDate || '', end: w.endDate || '', current: w.current || false, bullets: w.responsibilities?.length ? w.responsibilities : [''] })));
        if (d.education?.length) setEdu(d.education.map((e, i) => ({ id: i + 1, school: e.institution || '', degree: e.degree || '', field: e.field || '', date: e.graduationDate || '', gpa: e.gpa || '' })));
        if (d.skills?.length) setSkills(d.skills);
        Alert.alert('Success', 'Resume parsed! Review and edit.');
      }
    } catch (e) { Alert.alert('Error', e.message); setUploadedFile(null); }
    setParsing(false);
  };

  // AI Generate bullets
  const generateBullets = async (id) => {
    const w = work.find(x => x.id === id);
    if (!w?.title || !w?.company) { Alert.alert('Missing', 'Enter job title and company first'); return; }
    
    setGenerating(id);
    try {
      const res = await fetch(`${API_URL}/api/generate-responsibilities`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: w.title, company: w.company, jobDescription: jobDesc })
      });
      const data = await res.json();
      if (data.success && data.responsibilities) {
        updateWork(id, 'bullets', data.responsibilities);
        Alert.alert('Success', 'AI generated bullets!');
      }
    } catch (e) { Alert.alert('Error', e.message); }
    setGenerating(null);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return personal.name && personal.email && personal.phone;
      case 2: return work[0]?.company && work[0]?.title;
      case 3: return edu[0]?.school && edu[0]?.degree;
      default: return true;
    }
  };

  const goNext = () => {
    if (step < 5 && !canProceed()) { Alert.alert('Missing Info', 'Fill required fields'); return; }
    if (step === 5) generatePreview();
    else setStep(step + 1);
  };

  const goBack = () => step > 1 ? setStep(step - 1) : navigation.goBack();

  const generatePreview = () => {
    setLoading(true);
    const t = TEMPLATES.find(x => x.id === template);
    const c = { ats: '#1E293B', modern: '#059669', classic: '#1E293B' }[template];
    const validSkills = skills.filter(s => s.trim());
    
    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;padding:16px;background:#f5f5f5;font-size:11px;line-height:1.4}
      .card{background:#fff;border-radius:8px;padding:24px;max-width:550px;margin:0 auto;${template === 'modern' ? 'border-left:5px solid '+c : ''}}
      .header{margin-bottom:16px;${template !== 'modern' ? 'border-bottom:2px solid '+c+';padding-bottom:12px' : ''}}
      .name{font-size:22px;font-weight:700;color:${c}}.contact{font-size:10px;color:#666;margin-top:4px}
      .section{margin-bottom:14px}.section-title{font-size:11px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid ${c};padding-bottom:3px;margin-bottom:8px}
      .job{margin-bottom:10px}.job-header{display:flex;justify-content:space-between}.job-title{font-weight:600;color:#333}.job-company{color:${c}}.job-date{font-size:9px;color:#888}
      .bullets{padding-left:14px;margin-top:4px}.bullets li{margin-bottom:2px;color:#555;font-size:10px}
      .edu{margin-bottom:6px}.school{font-weight:600;color:#333}.degree{color:#555}.grad{font-size:9px;color:#888}
      .skills{display:flex;flex-wrap:wrap;gap:4px}.skill{background:${template === 'ats' ? '#f0f0f0' : c+'15'};color:${template === 'ats' ? '#333' : c};padding:3px 8px;border-radius:${template === 'ats' ? '2px' : '10px'};font-size:9px}
      .watermark{text-align:center;color:#aaa;font-size:9px;margin-top:16px;padding-top:10px;border-top:1px dashed #ddd}</style></head>
      <body><div class="card">
        <div class="header">
          <div class="name">${personal.name || 'Your Name'}</div>
          <div class="contact">${personal.email || 'email'}${personal.phone ? ' | ' + personal.phone : ''}${personal.location ? ' | ' + personal.location : ''}${personal.linkedin ? ' | LinkedIn' : ''}</div>
        </div>
        <div class="section"><div class="section-title">Experience</div>
          ${work.map(w => `<div class="job"><div class="job-header"><div><span class="job-title">${w.title || 'Title'}</span> <span class="job-company">| ${w.company || 'Company'}</span></div><span class="job-date">${w.start || 'Start'} - ${w.current ? 'Present' : (w.end || 'End')}</span></div>${w.bullets.filter(b => b).length ? `<ul class="bullets">${w.bullets.filter(b => b).map(b => `<li>${b}</li>`).join('')}</ul>` : ''}</div>`).join('')}
        </div>
        <div class="section"><div class="section-title">Education</div>
          ${edu.map(e => `<div class="edu"><div class="school">${e.school || 'School'}</div><div class="degree">${e.degree || 'Degree'}${e.field ? ' in ' + e.field : ''}${e.gpa ? ' | GPA: ' + e.gpa : ''}</div>${e.date ? `<div class="grad">${e.date}</div>` : ''}</div>`).join('')}
        </div>
        ${validSkills.length ? `<div class="section"><div class="section-title">Skills</div><div class="skills">${validSkills.map(s => `<span class="skill">${s}</span>`).join('')}</div></div>` : ''}
        <div class="watermark">PREVIEW - Watermark removed in final</div>
      </div></body></html>`;
    
    setPreviewHtml(html);
    setStep(6);
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!isSubscribed) {
      Alert.alert('Payment Required', '$4.99 to download', [{ text: 'Cancel' }, { text: 'Pay', onPress: () => Alert.alert('PayPal', 'Use web for payments') }]);
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/user/subscription-download`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ documentType: 'ai-resume', template })
      });
      const clean = previewHtml.replace(/<div class="watermark">.*?<\/div>/, '');
      const { uri } = await Print.printToFileAsync({ html: clean });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      Alert.alert('Success', 'Resume downloaded!');
    } catch (e) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  // Progress
  const Progress = () => (
    <View style={styles.progress}>
      {[1,2,3,4,5,6].map(i => (
        <View key={i} style={styles.progressItem}>
          <TouchableOpacity style={[styles.dot, step >= i && styles.dotActive, step === i && styles.dotCurrent]} onPress={() => i < step && setStep(i)}>
            <Text style={[styles.dotText, step >= i && styles.dotTextActive]}>{step > i ? '✓' : i}</Text>
          </TouchableOpacity>
          {i < 6 && <View style={[styles.line, step > i && styles.lineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>✨ AI Resume Builder</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <Progress />
      
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Personal Info</Text>
              <Text style={styles.stepDesc}>Enter your contact details</Text>
              
              {/* Upload */}
              <View style={styles.uploadBox}>
                <Text style={styles.uploadTitle}>📤 Quick Start</Text>
                <Text style={styles.uploadDesc}>Upload existing resume to auto-fill</Text>
                {uploadedFile ? (
                  <View style={styles.uploadedRow}>
                    <Text style={styles.uploadedName}>📎 {uploadedFile}</Text>
                    <TouchableOpacity onPress={() => setUploadedFile(null)}><Text style={styles.clearBtn}>✕</Text></TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} disabled={parsing}>
                    {parsing ? <ActivityIndicator color="#7C4DFF" /> : <Text style={styles.uploadBtnText}>Upload PDF/DOCX</Text>}
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or enter manually</Text><View style={styles.dividerLine} /></View>
              
              <Input label="Full Name" value={personal.name} onChangeText={v => updatePersonal('name', v)} placeholder="John Smith" required />
              <View style={styles.row}>
                <View style={styles.flex1}><Input label="Email" value={personal.email} onChangeText={v => updatePersonal('email', v)} placeholder="john@email.com" keyboardType="email-address" required /></View>
                <View style={styles.flex1}><Input label="Phone" value={personal.phone} onChangeText={v => updatePersonal('phone', v)} placeholder="(555) 123-4567" keyboardType="phone-pad" required /></View>
              </View>
              <Input label="Location" value={personal.location} onChangeText={v => updatePersonal('location', v)} placeholder="San Francisco, CA" />
              <Input label="LinkedIn" value={personal.linkedin} onChangeText={v => updatePersonal('linkedin', v)} placeholder="linkedin.com/in/yourname" />
            </View>
          )}
          
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Work Experience</Text>
              <Text style={styles.stepDesc}>Add your work history</Text>
              
              {work.map((w, idx) => (
                <View key={w.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Position {idx + 1}</Text>
                    {work.length > 1 && <TouchableOpacity onPress={() => removeWork(w.id)}><Text style={styles.removeBtn}>✕</Text></TouchableOpacity>}
                  </View>
                  <View style={styles.row}>
                    <View style={styles.flex1}><Input label="Job Title" value={w.title} onChangeText={v => updateWork(w.id, 'title', v)} placeholder="Software Engineer" required={idx === 0} /></View>
                    <View style={styles.flex1}><Input label="Company" value={w.company} onChangeText={v => updateWork(w.id, 'company', v)} placeholder="Acme Corp" required={idx === 0} /></View>
                  </View>
                  <Input label="Location" value={w.location} onChangeText={v => updateWork(w.id, 'location', v)} placeholder="San Francisco, CA" />
                  <View style={styles.row}>
                    <View style={styles.flex1}><Input label="Start" value={w.start} onChangeText={v => updateWork(w.id, 'start', v)} placeholder="2020-01" /></View>
                    <View style={styles.flex1}><Input label="End" value={w.end} onChangeText={v => updateWork(w.id, 'end', v)} placeholder="Present" /></View>
                  </View>
                  
                  <View style={styles.bulletsHeader}>
                    <Text style={styles.bulletsLabel}>Key Achievements</Text>
                    <TouchableOpacity style={styles.aiBtn} onPress={() => generateBullets(w.id)} disabled={generating === w.id}>
                      {generating === w.id ? <ActivityIndicator size="small" color="#7C4DFF" /> : <><Text style={styles.aiBtnIcon}>✨</Text><Text style={styles.aiBtnText}>AI Generate</Text></>}
                    </TouchableOpacity>
                  </View>
                  {w.bullets.map((b, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <TextInput style={styles.bulletInput} value={b} onChangeText={v => updateBullet(w.id, i, v)} placeholder="Describe achievement..." placeholderTextColor={COLORS.textTertiary} multiline />
                      {w.bullets.length > 1 && <TouchableOpacity onPress={() => removeBullet(w.id, i)}><Text style={styles.removeBullet}>✕</Text></TouchableOpacity>}
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addBulletBtn} onPress={() => addBullet(w.id)}><Text style={styles.addBulletText}>+ Add bullet</Text></TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={addWork}><Text style={styles.addBtnText}>+ Add Position</Text></TouchableOpacity>
            </View>
          )}
          
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Education</Text>
              <Text style={styles.stepDesc}>Add your education</Text>
              
              {edu.map((e, idx) => (
                <View key={e.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Education {idx + 1}</Text>
                    {edu.length > 1 && <TouchableOpacity onPress={() => removeEdu(e.id)}><Text style={styles.removeBtn}>✕</Text></TouchableOpacity>}
                  </View>
                  <Input label="School" value={e.school} onChangeText={v => updateEdu(e.id, 'school', v)} placeholder="Stanford University" required={idx === 0} />
                  <View style={styles.row}>
                    <View style={styles.flex1}><Input label="Degree" value={e.degree} onChangeText={v => updateEdu(e.id, 'degree', v)} placeholder="Bachelor's" required={idx === 0} /></View>
                    <View style={styles.flex1}><Input label="Field" value={e.field} onChangeText={v => updateEdu(e.id, 'field', v)} placeholder="Computer Science" /></View>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.flex1}><Input label="Graduation" value={e.date} onChangeText={v => updateEdu(e.id, 'date', v)} placeholder="2020-05" /></View>
                    <View style={styles.flex1}><Input label="GPA" value={e.gpa} onChangeText={v => updateEdu(e.id, 'gpa', v)} placeholder="3.8" keyboardType="decimal-pad" /></View>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={addEdu}><Text style={styles.addBtnText}>+ Add Education</Text></TouchableOpacity>
            </View>
          )}
          
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Skills</Text>
              <Text style={styles.stepDesc}>List your key skills</Text>
              
              {skills.map((s, i) => (
                <View key={i} style={styles.skillRow}>
                  <TextInput style={styles.skillInput} value={s} onChangeText={v => updateSkill(i, v)} placeholder={`Skill ${i + 1}`} placeholderTextColor={COLORS.textTertiary} />
                  {skills.length > 1 && <TouchableOpacity onPress={() => removeSkill(i)}><Text style={styles.removeSkill}>✕</Text></TouchableOpacity>}
                </View>
              ))}
              <TouchableOpacity style={styles.addBtn} onPress={addSkill}><Text style={styles.addBtnText}>+ Add Skill</Text></TouchableOpacity>
              
              <View style={styles.skillPreview}>
                <Text style={styles.skillPreviewTitle}>Preview:</Text>
                <View style={styles.skillChips}>{skills.filter(s => s.trim()).map((s, i) => <View key={i} style={styles.skillChip}><Text style={styles.skillChipText}>{s}</Text></View>)}</View>
              </View>
            </View>
          )}
          
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Template & Target</Text>
              <Text style={styles.stepDesc}>Choose style and add job description</Text>
              
              {TEMPLATES.map(t => (
                <TouchableOpacity key={t.id} style={[styles.templateCard, template === t.id && styles.templateSelected]} onPress={() => setTemplate(t.id)}>
                  <LinearGradient colors={[t.color, t.color + 'dd']} style={styles.templateIcon}><Text style={styles.templateEmoji}>{t.icon}</Text></LinearGradient>
                  <View style={styles.templateInfo}><Text style={styles.templateName}>{t.name}</Text><Text style={styles.templateDesc}>{t.desc}</Text></View>
                  {template === t.id && <View style={[styles.templateCheck, { backgroundColor: t.color }]}><Text style={styles.checkText}>✓</Text></View>}
                </TouchableOpacity>
              ))}
              
              <Input label="Job Description (Optional)" value={jobDesc} onChangeText={setJobDesc} placeholder="Paste target job description to tailor your resume..." multiline />
            </View>
          )}
          
          {step === 6 && (
            <View style={styles.previewContainer}>
              <Text style={styles.stepTitle}>Preview</Text>
              <View style={styles.previewCard}><WebView source={{ html: previewHtml }} style={styles.webview} scalesPageToFit /></View>
              <View style={styles.previewNote}><Text style={styles.previewNoteText}>⚠️ Preview only. Final PDF will be clean.</Text></View>
            </View>
          )}
          
        </ScrollView>
      </KeyboardAvoidingView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#7C4DFF' }]} onPress={step === 6 ? handleDownload : goNext} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{step === 6 ? (isSubscribed ? 'Download PDF' : 'Pay $4.99 & Download') : 'Continue'}</Text>}
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
  progress: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border },
  dotActive: { borderColor: '#7C4DFF', backgroundColor: '#EDE7F6' },
  dotCurrent: { backgroundColor: '#7C4DFF', borderColor: '#7C4DFF' },
  dotText: { fontSize: 11, fontWeight: '600', color: COLORS.textTertiary },
  dotTextActive: { color: '#7C4DFF' },
  line: { width: 14, height: 2, backgroundColor: COLORS.border, marginHorizontal: 2 },
  lineActive: { backgroundColor: '#7C4DFF' },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.xs },
  stepDesc: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  
  uploadBox: { backgroundColor: '#EDE7F6', padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#D1C4E9' },
  uploadTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#5E35B1' },
  uploadDesc: { fontSize: FONT_SIZES.sm, color: '#7E57C2', marginBottom: SPACING.md },
  uploadBtn: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 2, borderStyle: 'dashed', borderColor: '#7C4DFF', alignItems: 'center' },
  uploadBtnText: { color: '#7C4DFF', fontWeight: '600' },
  uploadedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  uploadedName: { color: '#5E35B1', fontWeight: '500' },
  clearBtn: { color: COLORS.error, padding: 4, fontSize: 16 },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { paddingHorizontal: SPACING.md, color: COLORS.textTertiary, fontSize: FONT_SIZES.sm },
  
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  required: { color: COLORS.error },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, minHeight: 52 },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: SPACING.md },
  
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#7C4DFF' },
  removeBtn: { color: COLORS.error, fontSize: 16 },
  
  bulletsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  bulletsLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE7F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: BORDER_RADIUS.md },
  aiBtnIcon: { fontSize: 14, marginRight: 4 },
  aiBtnText: { fontSize: FONT_SIZES.sm, color: '#7C4DFF', fontWeight: '600' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  bulletDot: { fontSize: 18, color: COLORS.textTertiary, marginRight: 8, marginTop: 6 },
  bulletInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, fontSize: FONT_SIZES.sm, color: COLORS.text, minHeight: 40 },
  removeBullet: { color: COLORS.error, padding: 8 },
  addBulletBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  addBulletText: { color: '#7C4DFF', fontWeight: '600', fontSize: FONT_SIZES.sm },
  
  addBtn: { paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 2, borderColor: '#7C4DFF', borderRadius: BORDER_RADIUS.lg, borderStyle: 'dashed' },
  addBtnText: { color: '#7C4DFF', fontWeight: '700' },
  
  skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  skillInput: { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingVertical: 12, paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.md, color: COLORS.text },
  removeSkill: { color: COLORS.error, padding: 10, fontSize: 16 },
  skillPreview: { marginTop: SPACING.xl, backgroundColor: COLORS.background, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg },
  skillPreviewTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  skillChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  skillChip: { backgroundColor: '#7C4DFF', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  skillChipText: { color: '#fff', fontSize: FONT_SIZES.sm },
  
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, marginBottom: SPACING.sm, borderWidth: 2, borderColor: COLORS.border },
  templateSelected: { borderColor: '#7C4DFF', backgroundColor: '#EDE7F6' },
  templateIcon: { width: 44, height: 44, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  templateEmoji: { fontSize: 22 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  templateDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  templateCheck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  previewContainer: { flex: 1, padding: SPACING.lg },
  previewCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', minHeight: 450, ...SHADOWS.md },
  webview: { flex: 1 },
  previewNote: { backgroundColor: '#FEF3C7', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.md },
  previewNoteText: { fontSize: FONT_SIZES.sm, color: '#92400e', textAlign: 'center' },
  bottomBar: { padding: SPACING.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  primaryBtn: { paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  primaryBtnText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#fff' },
});
