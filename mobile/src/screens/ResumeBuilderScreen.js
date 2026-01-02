import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Input, Select, Header, RadioGroup } from '../components/ui';
import { useAuth, API_URL } from '../context/AuthContext';
import { RESUME_TEMPLATES, US_STATES } from '../constants/formData';

export default function ResumeBuilderScreen({ navigation }) {
  const { token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  
  // Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    summary: '',
  });
  
  // Work Experience
  const [workExperience, setWorkExperience] = useState([{
    id: 1,
    company: '',
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  }]);
  
  // Education
  const [education, setEducation] = useState([{
    id: 1,
    school: '',
    degree: '',
    field: '',
    graduationDate: '',
    gpa: '',
  }]);
  
  // Skills
  const [skills, setSkills] = useState('');

  const updatePersonalInfo = (field, value) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateWorkExperience = (id, field, value) => {
    setWorkExperience(prev => prev.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const addWorkExperience = () => {
    setWorkExperience(prev => [...prev, {
      id: Date.now(),
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }]);
  };

  const removeWorkExperience = (id) => {
    if (workExperience.length > 1) {
      setWorkExperience(prev => prev.filter(exp => exp.id !== id));
    }
  };

  const updateEducation = (id, field, value) => {
    setEducation(prev => prev.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const addEducation = () => {
    setEducation(prev => [...prev, {
      id: Date.now(),
      school: '',
      degree: '',
      field: '',
      graduationDate: '',
      gpa: '',
    }]);
  };

  const removeEducation = (id) => {
    if (education.length > 1) {
      setEducation(prev => prev.filter(edu => edu.id !== id));
    }
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return selectedTemplate !== '';
      case 2:
        return personalInfo.fullName && personalInfo.email && personalInfo.phone;
      case 3:
        return workExperience[0]?.company && workExperience[0]?.title;
      case 4:
        return education[0]?.school && education[0]?.degree;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    if (currentStep < 6) {
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
      const html = createResumeHtml();
      setPreviewHtml(html);
      setCurrentStep(6);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const createResumeHtml = () => {
    const skillsList = skills.split(',').map(s => s.trim()).filter(s => s);
    
    // Template colors
    const colors = {
      professional: { primary: '#1e3a5f', accent: '#2563eb' },
      creative: { primary: '#7c3aed', accent: '#a855f7' },
      minimal: { primary: '#374151', accent: '#6b7280' },
      executive: { primary: '#1f2937', accent: '#d97706' },
    };
    
    const { primary, accent } = colors[selectedTemplate] || colors.professional;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; font-size: 11px; line-height: 1.4; }
          .container { background: white; padding: 25px; max-width: 600px; margin: 0 auto; border-radius: 8px; }
          
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid ${primary}; }
          .name { font-size: 24px; font-weight: bold; color: ${primary}; margin-bottom: 5px; }
          .contact { color: #666; font-size: 10px; }
          .contact a { color: ${accent}; text-decoration: none; }
          
          .section { margin-bottom: 15px; }
          .section-title { font-size: 12px; font-weight: bold; color: ${primary}; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid ${accent}; padding-bottom: 3px; margin-bottom: 8px; }
          
          .summary { color: #444; font-size: 10px; line-height: 1.5; }
          
          .experience-item { margin-bottom: 10px; }
          .job-header { display: flex; justify-content: space-between; align-items: baseline; }
          .job-title { font-weight: bold; color: #333; }
          .job-company { color: ${accent}; }
          .job-date { font-size: 9px; color: #888; }
          .job-location { font-size: 9px; color: #888; }
          .job-desc { color: #555; font-size: 10px; margin-top: 3px; }
          
          .edu-item { margin-bottom: 8px; }
          .school { font-weight: bold; color: #333; }
          .degree { color: #555; }
          .grad-date { font-size: 9px; color: #888; }
          
          .skills-list { display: flex; flex-wrap: wrap; gap: 5px; }
          .skill { background: ${primary}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 9px; }
          
          .watermark { text-align: center; color: #999; font-size: 10px; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="name">${personalInfo.fullName || 'Your Name'}</div>
            <div class="contact">
              ${personalInfo.email || 'email@example.com'} | ${personalInfo.phone || '(555) 123-4567'}
              ${personalInfo.location ? ` | ${personalInfo.location}` : ''}
              ${personalInfo.linkedin ? `<br><a href="#">LinkedIn</a>` : ''}
              ${personalInfo.website ? ` | <a href="#">Portfolio</a>` : ''}
            </div>
          </div>
          
          ${personalInfo.summary ? `
            <div class="section">
              <div class="section-title">Professional Summary</div>
              <div class="summary">${personalInfo.summary}</div>
            </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Work Experience</div>
            ${workExperience.map(exp => `
              <div class="experience-item">
                <div class="job-header">
                  <div>
                    <span class="job-title">${exp.title || 'Job Title'}</span>
                    <span class="job-company"> | ${exp.company || 'Company'}</span>
                  </div>
                  <span class="job-date">${exp.startDate || 'Start'} - ${exp.current ? 'Present' : (exp.endDate || 'End')}</span>
                </div>
                ${exp.location ? `<div class="job-location">${exp.location}</div>` : ''}
                ${exp.description ? `<div class="job-desc">${exp.description}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Education</div>
            ${education.map(edu => `
              <div class="edu-item">
                <div class="school">${edu.school || 'University'}</div>
                <div class="degree">${edu.degree || 'Degree'}${edu.field ? ` in ${edu.field}` : ''}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
                ${edu.graduationDate ? `<div class="grad-date">${edu.graduationDate}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          ${skillsList.length > 0 ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-list">
                ${skillsList.map(skill => `<span class="skill">${skill}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
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
        'Pay $4.99 to download your resume.',
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
        body: JSON.stringify({ documentType: 'resume', count: 1 }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Download failed');
      }
      
      await generateAndSharePdf();
      Alert.alert('Success', 'Resume downloaded successfully!');
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndSharePdf = async () => {
    const html = createResumeHtml().replace(
      '<div class="watermark">PREVIEW - Watermark will be removed in final document</div>',
      ''
    );
    
    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Resume' });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>✨ Choose Template</Text>
            <Text style={styles.stepDescription}>Select a design style for your resume</Text>
            
            {RESUME_TEMPLATES.map((template) => (
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
                  <View style={[styles.checkmark, { backgroundColor: '#7c3aed' }]}>
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
            <Text style={styles.stepTitle}>👤 Personal Information</Text>
            <Text style={styles.stepDescription}>Enter your contact details</Text>
            
            <Input
              label="Full Name"
              value={personalInfo.fullName}
              onChangeText={(v) => updatePersonalInfo('fullName', v)}
              placeholder="John Smith"
              required
            />
            
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Email"
                  value={personalInfo.email}
                  onChangeText={(v) => updatePersonalInfo('email', v)}
                  placeholder="john@email.com"
                  keyboardType="email-address"
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Phone"
                  value={personalInfo.phone}
                  onChangeText={(v) => updatePersonalInfo('phone', v)}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  required
                />
              </View>
            </View>
            
            <Input
              label="Location"
              value={personalInfo.location}
              onChangeText={(v) => updatePersonalInfo('location', v)}
              placeholder="New York, NY"
            />
            
            <Input
              label="LinkedIn URL"
              value={personalInfo.linkedin}
              onChangeText={(v) => updatePersonalInfo('linkedin', v)}
              placeholder="linkedin.com/in/yourname"
              autoCapitalize="none"
            />
            
            <Input
              label="Professional Summary"
              value={personalInfo.summary}
              onChangeText={(v) => updatePersonalInfo('summary', v)}
              placeholder="Brief overview of your experience and goals..."
              multiline
              numberOfLines={4}
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>💼 Work Experience</Text>
            <Text style={styles.stepDescription}>Add your work history</Text>
            
            {workExperience.map((exp, index) => (
              <View key={exp.id} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceNumber}>Position {index + 1}</Text>
                  {workExperience.length > 1 && (
                    <TouchableOpacity onPress={() => removeWorkExperience(exp.id)}>
                      <Text style={styles.removeButton}>✕ Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <Input
                  label="Job Title"
                  value={exp.title}
                  onChangeText={(v) => updateWorkExperience(exp.id, 'title', v)}
                  placeholder="Software Engineer"
                  required={index === 0}
                />
                
                <Input
                  label="Company"
                  value={exp.company}
                  onChangeText={(v) => updateWorkExperience(exp.id, 'company', v)}
                  placeholder="Acme Corp"
                  required={index === 0}
                />
                
                <Input
                  label="Location"
                  value={exp.location}
                  onChangeText={(v) => updateWorkExperience(exp.id, 'location', v)}
                  placeholder="San Francisco, CA"
                />
                
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Start Date"
                      value={exp.startDate}
                      onChangeText={(v) => updateWorkExperience(exp.id, 'startDate', v)}
                      placeholder="Jan 2020"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Input
                      label="End Date"
                      value={exp.endDate}
                      onChangeText={(v) => updateWorkExperience(exp.id, 'endDate', v)}
                      placeholder="Present"
                      editable={!exp.current}
                    />
                  </View>
                </View>
                
                <Input
                  label="Description"
                  value={exp.description}
                  onChangeText={(v) => updateWorkExperience(exp.id, 'description', v)}
                  placeholder="Key responsibilities and achievements..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            ))}
            
            <TouchableOpacity style={styles.addButton} onPress={addWorkExperience}>
              <Text style={styles.addButtonText}>+ Add Another Position</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>🎓 Education</Text>
            <Text style={styles.stepDescription}>Add your educational background</Text>
            
            {education.map((edu, index) => (
              <View key={edu.id} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceNumber}>Education {index + 1}</Text>
                  {education.length > 1 && (
                    <TouchableOpacity onPress={() => removeEducation(edu.id)}>
                      <Text style={styles.removeButton}>✕ Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <Input
                  label="School/University"
                  value={edu.school}
                  onChangeText={(v) => updateEducation(edu.id, 'school', v)}
                  placeholder="Harvard University"
                  required={index === 0}
                />
                
                <Input
                  label="Degree"
                  value={edu.degree}
                  onChangeText={(v) => updateEducation(edu.id, 'degree', v)}
                  placeholder="Bachelor of Science"
                  required={index === 0}
                />
                
                <Input
                  label="Field of Study"
                  value={edu.field}
                  onChangeText={(v) => updateEducation(edu.id, 'field', v)}
                  placeholder="Computer Science"
                />
                
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Input
                      label="Graduation Date"
                      value={edu.graduationDate}
                      onChangeText={(v) => updateEducation(edu.id, 'graduationDate', v)}
                      placeholder="May 2020"
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Input
                      label="GPA (optional)"
                      value={edu.gpa}
                      onChangeText={(v) => updateEducation(edu.id, 'gpa', v)}
                      placeholder="3.8"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={styles.addButton} onPress={addEducation}>
              <Text style={styles.addButtonText}>+ Add Another Education</Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>🛠️ Skills</Text>
            <Text style={styles.stepDescription}>List your key skills (comma separated)</Text>
            
            <Input
              label="Skills"
              value={skills}
              onChangeText={setSkills}
              placeholder="JavaScript, React, Python, Leadership, Communication..."
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.skillsPreview}>
              <Text style={styles.skillsPreviewTitle}>Preview:</Text>
              <View style={styles.skillsPreviewList}>
                {skills.split(',').map((skill, i) => skill.trim() && (
                  <View key={i} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      case 6:
        return (
          <View style={styles.previewContainer}>
            <Text style={styles.stepTitle}>Preview</Text>
            <View style={styles.previewWebview}>
              <WebView source={{ html: previewHtml }} style={styles.webview} scalesPageToFit={true} />
            </View>
            <View style={styles.previewNote}>
              <Text style={styles.previewNoteIcon}>⚠️</Text>
              <Text style={styles.previewNoteText}>Preview your resume. Final PDF will be clean without watermarks.</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderProgress = () => (
    <View style={styles.progress}>
      {[1, 2, 3, 4, 5, 6].map((step) => (
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
          {step < 6 && (
            <View style={[styles.progressLine, currentStep > step && styles.progressLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="AI Resume Builder" showBack onBack={handleBack} variant="light" />
      
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {renderProgress()}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {renderStepContent()}
        </ScrollView>
        
        <View style={styles.actions}>
          {currentStep < 6 ? (
            <Button variant="primary" size="lg" fullWidth onPress={currentStep === 5 ? generatePreview : handleNext} loading={isLoading} style={{ backgroundColor: '#7c3aed' }}>
              {currentStep === 5 ? 'Generate Preview' : 'Continue'}
            </Button>
          ) : (
            <Button variant="primary" size="lg" fullWidth onPress={handleDownload} loading={isLoading} style={{ backgroundColor: '#7c3aed' }}>
              {isSubscribed ? 'Download (Subscription)' : 'Pay $4.99 & Download'}
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
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.border,
  },
  progressDotActive: { backgroundColor: '#f5f3ff', borderColor: '#7c3aed' },
  progressDotCurrent: { backgroundColor: '#7c3aed' },
  progressDotText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  progressDotTextActive: { color: '#7c3aed' },
  progressLine: { width: 16, height: 2, backgroundColor: COLORS.border, marginHorizontal: 2 },
  progressLineActive: { backgroundColor: '#7c3aed' },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  stepDescription: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  templateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md,
    borderWidth: 2, borderColor: COLORS.border,
  },
  templateCardSelected: { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
  templateIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  templateEmoji: { fontSize: 24 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.textPrimary },
  templateDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  checkmark: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmarkText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  experienceCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  experienceHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md,
  },
  experienceNumber: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#7c3aed' },
  removeButton: { fontSize: FONT_SIZES.sm, color: COLORS.error },
  addButton: {
    paddingVertical: SPACING.md, alignItems: 'center',
    borderWidth: 2, borderColor: '#7c3aed', borderRadius: BORDER_RADIUS.md, borderStyle: 'dashed',
  },
  addButtonText: { color: '#7c3aed', fontWeight: '600' },
  skillsPreview: { marginTop: SPACING.lg },
  skillsPreviewTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  skillsPreviewList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  skillChip: { backgroundColor: '#7c3aed', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  skillChipText: { color: COLORS.white, fontSize: FONT_SIZES.sm },
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
