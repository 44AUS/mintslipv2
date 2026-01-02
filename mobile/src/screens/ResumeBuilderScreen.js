import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  SafeAreaView, Alert, KeyboardAvoidingView, Platform, TextInput,
  ActivityIndicator, Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Header, Select, RadioGroup, Checkbox } from '../components/ui';
import { useAuth, API_URL } from '../context/AuthContext';

// EXACT SAME TEMPLATES AS WEB
const TEMPLATES = [
  { 
    value: "ats", 
    label: "ATS Optimized", 
    description: "Clean, simple format that passes ATS scanners",
    color: "#2563eb",
    icon: "📄"
  },
  { 
    value: "modern", 
    label: "Modern Professional", 
    description: "Contemporary design with subtle accents",
    color: "#059669",
    icon: "✨"
  },
  { 
    value: "classic", 
    label: "Classic Executive", 
    description: "Traditional formal style for senior roles",
    color: "#1e293b",
    icon: "📋"
  }
];

// EXACT SAME FONTS AS WEB
const FONTS = [
  { value: "Montserrat", label: "Montserrat", style: "Modern & Clean" },
  { value: "Times New Roman", label: "Times New Roman", style: "Traditional" },
  { value: "Calibri", label: "Calibri", style: "Professional" },
  { value: "Arial", label: "Arial", style: "Classic" },
  { value: "Helvetica", label: "Helvetica", style: "Clean & Minimal" }
];

// EXACT SAME LAYOUT OPTIONS AS WEB
const LAYOUT_OPTIONS = [
  { value: "standard", label: "Standard", description: "Skills & Education at the bottom" },
  { value: "compact", label: "Highlighted", description: "Skills & Education under Summary" }
];

// Form Input Component
const FormInput = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, required, editable = true, multiline, numberOfLines, style }) => (
  <View style={[styles.inputContainer, style]}>
    {label && (
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
    )}
    <TextInput
      style={[
        styles.textInput,
        multiline && { minHeight: numberOfLines ? numberOfLines * 24 : 80, textAlignVertical: 'top' },
        !editable && styles.textInputDisabled,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      keyboardType={keyboardType || 'default'}
      maxLength={maxLength}
      editable={editable}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize="none"
      autoCorrect={false}
    />
  </View>
);

export default function ResumeBuilderScreen({ navigation }) {
  const { user, token, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Resume parsing states
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [uploadedResumeName, setUploadedResumeName] = useState(null);
  
  // AI Generation states
  const [generatingResponsibilities, setGeneratingResponsibilities] = useState(null);
  const [isScrapingJob, setIsScrapingJob] = useState(false);
  
  // Form data - EXACT SAME STRUCTURE AS WEB
  const [formData, setFormData] = useState({
    template: "ats",
    font: "Calibri",
    sectionLayout: "standard",
    onePage: false,
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: ""
    },
    workExperience: [
      {
        id: `work_${Date.now()}_0`,
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        responsibilities: [""]
      }
    ],
    education: [
      {
        id: `edu_${Date.now()}_0`,
        institution: "",
        degree: "",
        field: "",
        graduationDate: "",
        gpa: ""
      }
    ],
    skills: [""],
    targetJobTitle: "",
    jobDescription: "",
    jobUrl: ""
  });

  // Handle input changes - same as web
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePersonalInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  // Work Experience handlers - EXACT SAME AS WEB
  const addWorkExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          id: `work_${Date.now()}_${prev.workExperience.length}`,
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          responsibilities: [""]
        }
      ]
    }));
  };

  const removeWorkExperience = (id) => {
    if (formData.workExperience.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(exp => exp.id !== id)
    }));
  };

  const updateWorkExperience = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addResponsibility = (expId) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === expId
          ? { ...exp, responsibilities: [...exp.responsibilities, ""] }
          : exp
      )
    }));
  };

  const updateResponsibility = (expId, index, value) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === expId
          ? {
              ...exp,
              responsibilities: exp.responsibilities.map((r, i) =>
                i === index ? value : r
              )
            }
          : exp
      )
    }));
  };

  const removeResponsibility = (expId, index) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp =>
        exp.id === expId
          ? {
              ...exp,
              responsibilities: exp.responsibilities.filter((_, i) => i !== index)
            }
          : exp
      )
    }));
  };

  // AI Generate Responsibilities - EXACT SAME AS WEB
  const generateAIResponsibilities = async (expId) => {
    const exp = formData.workExperience.find(e => e.id === expId);
    if (!exp) return;
    
    if (!exp.position || !exp.company) {
      Alert.alert('Missing Info', 'Please enter a job title and company name first');
      return;
    }
    
    setGeneratingResponsibilities(expId);
    
    try {
      const response = await fetch(`${API_URL}/api/generate-responsibilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: exp.position,
          company: exp.company,
          jobDescription: formData.jobDescription || ""
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.responsibilities) {
        setFormData(prev => ({
          ...prev,
          workExperience: prev.workExperience.map(e =>
            e.id === expId
              ? { ...e, responsibilities: data.responsibilities }
              : e
          )
        }));
        Alert.alert('Success', 'AI generated responsibilities! Review and edit as needed.');
      } else {
        throw new Error(data.detail || "Failed to generate responsibilities");
      }
    } catch (error) {
      console.error("Error generating responsibilities:", error);
      Alert.alert('Error', error.message || "Failed to generate responsibilities");
    } finally {
      setGeneratingResponsibilities(null);
    }
  };

  // Education handlers
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `edu_${Date.now()}_${prev.education.length}`,
          institution: "",
          degree: "",
          field: "",
          graduationDate: "",
          gpa: ""
        }
      ]
    }));
  };

  const removeEducation = (id) => {
    if (formData.education.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const updateEducation = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Skills handlers
  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, ""]
    }));
  };

  const updateSkill = (index, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => (i === index ? value : s))
    }));
  };

  const removeSkill = (index) => {
    if (formData.skills.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Scrape job URL - EXACT SAME AS WEB
  const scrapeJobUrl = async () => {
    if (!formData.jobUrl) {
      Alert.alert('Error', 'Please enter a job posting URL');
      return;
    }

    setIsScrapingJob(true);
    try {
      const response = await fetch(`${API_URL}/api/scrape-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.jobUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to scrape job posting");
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, jobDescription: data.jobDescription }));
      Alert.alert('Success', 'Job description extracted successfully!');
    } catch (error) {
      console.error("Error scraping job:", error);
      Alert.alert('Error', error.message || "Failed to extract job description. Please paste it manually.");
    } finally {
      setIsScrapingJob(false);
    }
  };

  // Parse uploaded resume - EXACT SAME AS WEB
  const handleResumeUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      
      const file = result.assets[0];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 10MB');
        return;
      }

      setIsParsingResume(true);
      setUploadedResumeName(file.name);

      // Read file and create FormData
      const fileUri = file.uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formDataUpload = new FormData();
      formDataUpload.append('file', {
        uri: fileUri,
        type: file.mimeType,
        name: file.name,
      });

      const response = await fetch(`${API_URL}/api/parse-resume`, {
        method: "POST",
        body: formDataUpload,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to parse resume";
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
        throw new Error(errorMessage);
      }

      const parseResult = await response.json();
      
      if (parseResult.success && parseResult.data) {
        const parsed = parseResult.data;
        
        // Update form data with parsed information
        setFormData(prev => ({
          ...prev,
          personalInfo: {
            fullName: parsed.personalInfo?.fullName || prev.personalInfo.fullName,
            email: parsed.personalInfo?.email || prev.personalInfo.email,
            phone: parsed.personalInfo?.phone || prev.personalInfo.phone,
            location: parsed.personalInfo?.location || prev.personalInfo.location,
            linkedin: parsed.personalInfo?.linkedin || prev.personalInfo.linkedin,
            website: parsed.personalInfo?.website || prev.personalInfo.website,
          },
          workExperience: parsed.workExperience?.length > 0 
            ? parsed.workExperience.map((exp, index) => ({
                id: `work_parsed_${Date.now()}_${index}`,
                company: exp.company || "",
                position: exp.position || "",
                location: exp.location || "",
                startDate: exp.startDate || "",
                endDate: exp.endDate || "",
                current: exp.current || false,
                responsibilities: exp.responsibilities || []
              }))
            : prev.workExperience,
          education: parsed.education?.length > 0
            ? parsed.education.map((edu, index) => ({
                id: `edu_parsed_${Date.now()}_${index}`,
                institution: edu.institution || "",
                degree: edu.degree || "",
                field: edu.field || "",
                graduationDate: edu.graduationDate || "",
                gpa: edu.gpa || ""
              }))
            : prev.education,
          skills: parsed.skills?.length > 0 ? parsed.skills : prev.skills
        }));
        
        Alert.alert('Success', 'Resume parsed successfully! Review and edit as needed.');
      } else {
        throw new Error("Failed to parse resume data");
      }
    } catch (error) {
      console.error("Error parsing resume:", error);
      Alert.alert('Error', error.message || "Failed to parse resume");
      setUploadedResumeName(null);
    } finally {
      setIsParsingResume(false);
    }
  };

  const clearUploadedResume = () => {
    setUploadedResumeName(null);
  };

  // Navigation
  const handleNext = () => {
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

  // Generate preview
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

  // Create Resume HTML - matching web templates
  const createResumeHtml = () => {
    const { personalInfo, workExperience, education, skills, template, font } = formData;
    
    const colors = {
      ats: { primary: '#000000', secondary: '#333333', accent: '#333333' },
      modern: { primary: '#059669', secondary: '#047857', accent: '#10b981' },
      classic: { primary: '#1e293b', secondary: '#334155', accent: '#475569' }
    };
    
    const { primary, secondary, accent } = colors[template] || colors.ats;
    const validSkills = skills.filter(s => s && s.trim());
    
    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === 'Present') return dateStr || '';
      try {
        const parts = dateStr.split('-');
        if (parts.length >= 2) {
          const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 15);
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: ${font}, Arial, sans-serif; 
            padding: 20px; 
            background: #f5f5f5; 
            font-size: 11px; 
            line-height: 1.4;
            color: #333;
          }
          .container { 
            background: white; 
            padding: 30px; 
            max-width: 650px; 
            margin: 0 auto; 
            border-radius: 8px;
            ${template === 'modern' ? 'border-left: 6px solid ' + primary + ';' : ''}
            ${template === 'classic' ? 'border-top: 4px solid ' + primary + ';' : ''}
          }
          
          .header { margin-bottom: 20px; }
          .name { 
            font-size: 24px; 
            font-weight: bold; 
            color: ${primary}; 
            margin-bottom: 8px;
          }
          .contact { 
            color: #666; 
            font-size: 10px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .contact span { white-space: nowrap; }
          .contact a { color: ${accent}; text-decoration: none; }
          
          .section { margin-bottom: 18px; }
          .section-title { 
            font-size: 13px; 
            font-weight: bold; 
            color: ${primary}; 
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: ${template === 'ats' ? '1px solid #333' : '2px solid ' + accent};
            padding-bottom: 4px;
            margin-bottom: 10px;
          }
          
          .job { margin-bottom: 14px; }
          .job-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: baseline;
            margin-bottom: 4px;
          }
          .job-title { font-weight: bold; color: ${secondary}; }
          .job-company { color: ${accent}; }
          .job-date { font-size: 10px; color: #888; }
          .job-location { font-size: 10px; color: #888; margin-bottom: 4px; }
          
          .responsibilities { padding-left: 16px; }
          .responsibilities li { 
            margin-bottom: 3px; 
            color: #555;
            font-size: 10px;
          }
          
          .edu-item { margin-bottom: 10px; }
          .school { font-weight: bold; color: ${secondary}; }
          .degree { color: #555; }
          .grad-info { font-size: 10px; color: #888; }
          
          .skills-list { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 6px; 
          }
          .skill { 
            background: ${template === 'ats' ? '#f0f0f0' : primary + '15'}; 
            color: ${template === 'ats' ? '#333' : primary};
            padding: 4px 10px; 
            border-radius: ${template === 'ats' ? '2px' : '12px'}; 
            font-size: 10px;
            ${template !== 'ats' ? 'border: 1px solid ' + primary + '30;' : ''}
          }
          
          .watermark { 
            text-align: center; 
            color: #999; 
            font-size: 10px; 
            margin-top: 20px; 
            padding-top: 15px; 
            border-top: 1px dashed #ddd; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="name">${personalInfo.fullName || 'Your Name'}</div>
            <div class="contact">
              ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ''}
              ${personalInfo.phone ? `<span>| ${personalInfo.phone}</span>` : ''}
              ${personalInfo.location ? `<span>| ${personalInfo.location}</span>` : ''}
              ${personalInfo.linkedin ? `<span>| <a href="#">LinkedIn</a></span>` : ''}
              ${personalInfo.website ? `<span>| <a href="#">Portfolio</a></span>` : ''}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Professional Experience</div>
            ${workExperience.map(exp => `
              <div class="job">
                <div class="job-header">
                  <div>
                    <span class="job-title">${exp.position || 'Position'}</span>
                    <span class="job-company"> | ${exp.company || 'Company'}</span>
                  </div>
                  <span class="job-date">${formatDate(exp.startDate)} - ${exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                </div>
                ${exp.location ? `<div class="job-location">${exp.location}</div>` : ''}
                ${exp.responsibilities && exp.responsibilities.filter(r => r).length > 0 ? `
                  <ul class="responsibilities">
                    ${exp.responsibilities.filter(r => r).map(r => `<li>${r}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Education</div>
            ${education.map(edu => `
              <div class="edu-item">
                <div class="school">${edu.institution || 'University'}</div>
                <div class="degree">${edu.degree || 'Degree'}${edu.field ? ' in ' + edu.field : ''}</div>
                <div class="grad-info">
                  ${edu.graduationDate ? formatDate(edu.graduationDate) : ''}
                  ${edu.gpa ? ' | GPA: ' + edu.gpa : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          ${validSkills.length > 0 ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div class="skills-list">
                ${validSkills.map(skill => `<span class="skill">${skill}</span>`).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="watermark">PREVIEW - Watermark will be removed in final document</div>
        </div>
      </body>
      </html>
    `;
  };

  // Download handlers
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
        body: JSON.stringify({
          documentType: 'ai-resume',
          template: formData.template,
        }),
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

  // Render steps
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderPersonalInfo();
      case 2: return renderWorkHistory();
      case 3: return renderEducation();
      case 4: return renderSkills();
      case 5: return renderTargetJob();
      case 6: return renderPreview();
      default: return null;
    }
  };

  // Step 1: Personal Info with Resume Upload
  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>📄 Personal Information</Text>
      <Text style={styles.stepDescription}>Enter your contact details or upload an existing resume</Text>
      
      {/* Resume Upload Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.uploadTitle}>Quick Start: Upload Existing Resume</Text>
        <Text style={styles.uploadDesc}>Upload a PDF or DOCX file to auto-fill your information</Text>
        
        {uploadedResumeName ? (
          <View style={styles.uploadedFile}>
            <Text style={styles.uploadedFileName}>📎 {uploadedResumeName}</Text>
            <TouchableOpacity onPress={clearUploadedResume}>
              <Text style={styles.clearUpload}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handleResumeUpload}
            disabled={isParsingResume}
          >
            {isParsingResume ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Text style={styles.uploadButtonIcon}>📤</Text>
                <Text style={styles.uploadButtonText}>Upload Resume (PDF/DOCX)</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or enter manually</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <FormInput
        label="Full Name"
        value={formData.personalInfo.fullName}
        onChangeText={(v) => handlePersonalInfoChange('fullName', v)}
        placeholder="John Smith"
        required
      />
      
      <View style={styles.row}>
        <View style={styles.flex1}>
          <FormInput
            label="Email"
            value={formData.personalInfo.email}
            onChangeText={(v) => handlePersonalInfoChange('email', v)}
            placeholder="john@email.com"
            keyboardType="email-address"
            required
          />
        </View>
        <View style={styles.flex1}>
          <FormInput
            label="Phone"
            value={formData.personalInfo.phone}
            onChangeText={(v) => handlePersonalInfoChange('phone', v)}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            required
          />
        </View>
      </View>
      
      <FormInput
        label="Location"
        value={formData.personalInfo.location}
        onChangeText={(v) => handlePersonalInfoChange('location', v)}
        placeholder="San Francisco, CA"
      />
      
      <FormInput
        label="LinkedIn URL"
        value={formData.personalInfo.linkedin}
        onChangeText={(v) => handlePersonalInfoChange('linkedin', v)}
        placeholder="linkedin.com/in/yourname"
      />
      
      <FormInput
        label="Portfolio/Website"
        value={formData.personalInfo.website}
        onChangeText={(v) => handlePersonalInfoChange('website', v)}
        placeholder="yourportfolio.com"
      />
    </View>
  );

  // Step 2: Work History with AI Generation
  const renderWorkHistory = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>💼 Work Experience</Text>
      <Text style={styles.stepDescription}>Add your work history. Use AI to generate bullet points!</Text>
      
      {formData.workExperience.map((exp, expIndex) => (
        <View key={exp.id} style={styles.experienceCard}>
          <View style={styles.experienceHeader}>
            <Text style={styles.experienceNumber}>Position {expIndex + 1}</Text>
            {formData.workExperience.length > 1 && (
              <TouchableOpacity onPress={() => removeWorkExperience(exp.id)}>
                <Text style={styles.removeButton}>✕ Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormInput
                label="Job Title"
                value={exp.position}
                onChangeText={(v) => updateWorkExperience(exp.id, 'position', v)}
                placeholder="Software Engineer"
                required={expIndex === 0}
              />
            </View>
            <View style={styles.flex1}>
              <FormInput
                label="Company"
                value={exp.company}
                onChangeText={(v) => updateWorkExperience(exp.id, 'company', v)}
                placeholder="Acme Corp"
                required={expIndex === 0}
              />
            </View>
          </View>
          
          <FormInput
            label="Location"
            value={exp.location}
            onChangeText={(v) => updateWorkExperience(exp.id, 'location', v)}
            placeholder="San Francisco, CA"
          />
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormInput
                label="Start Date"
                value={exp.startDate}
                onChangeText={(v) => updateWorkExperience(exp.id, 'startDate', v)}
                placeholder="2020-01"
              />
            </View>
            <View style={styles.flex1}>
              <FormInput
                label="End Date"
                value={exp.endDate}
                onChangeText={(v) => updateWorkExperience(exp.id, 'endDate', v)}
                placeholder="Present"
                editable={!exp.current}
              />
            </View>
          </View>
          
          <View style={styles.checkboxRow}>
            <Checkbox
              checked={exp.current}
              onPress={(v) => {
                updateWorkExperience(exp.id, 'current', v);
                if (v) updateWorkExperience(exp.id, 'endDate', 'Present');
              }}
              label="I currently work here"
            />
          </View>
          
          {/* Responsibilities with AI */}
          <View style={styles.responsibilitiesSection}>
            <View style={styles.responsibilitiesHeader}>
              <Text style={styles.responsibilitiesLabel}>Key Responsibilities</Text>
              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => generateAIResponsibilities(exp.id)}
                disabled={generatingResponsibilities === exp.id}
              >
                {generatingResponsibilities === exp.id ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Text style={styles.aiButtonIcon}>✨</Text>
                    <Text style={styles.aiButtonText}>Generate with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {exp.responsibilities.map((resp, respIndex) => (
              <View key={respIndex} style={styles.responsibilityRow}>
                <Text style={styles.bulletPoint}>•</Text>
                <TextInput
                  style={styles.responsibilityInput}
                  value={resp}
                  onChangeText={(v) => updateResponsibility(exp.id, respIndex, v)}
                  placeholder="Describe your achievement..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
                {exp.responsibilities.length > 1 && (
                  <TouchableOpacity onPress={() => removeResponsibility(exp.id, respIndex)}>
                    <Text style={styles.removeResponsibility}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <TouchableOpacity style={styles.addResponsibility} onPress={() => addResponsibility(exp.id)}>
              <Text style={styles.addResponsibilityText}>+ Add Bullet Point</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={styles.addButton} onPress={addWorkExperience}>
        <Text style={styles.addButtonText}>+ Add Another Position</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 3: Education
  const renderEducation = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🎓 Education</Text>
      <Text style={styles.stepDescription}>Add your educational background</Text>
      
      {formData.education.map((edu, index) => (
        <View key={edu.id} style={styles.experienceCard}>
          <View style={styles.experienceHeader}>
            <Text style={styles.experienceNumber}>Education {index + 1}</Text>
            {formData.education.length > 1 && (
              <TouchableOpacity onPress={() => removeEducation(edu.id)}>
                <Text style={styles.removeButton}>✕ Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <FormInput
            label="School/University"
            value={edu.institution}
            onChangeText={(v) => updateEducation(edu.id, 'institution', v)}
            placeholder="Stanford University"
            required={index === 0}
          />
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormInput
                label="Degree"
                value={edu.degree}
                onChangeText={(v) => updateEducation(edu.id, 'degree', v)}
                placeholder="Bachelor of Science"
                required={index === 0}
              />
            </View>
            <View style={styles.flex1}>
              <FormInput
                label="Field of Study"
                value={edu.field}
                onChangeText={(v) => updateEducation(edu.id, 'field', v)}
                placeholder="Computer Science"
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <FormInput
                label="Graduation Date"
                value={edu.graduationDate}
                onChangeText={(v) => updateEducation(edu.id, 'graduationDate', v)}
                placeholder="2020-05"
              />
            </View>
            <View style={styles.flex1}>
              <FormInput
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

  // Step 4: Skills
  const renderSkills = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🛠️ Skills</Text>
      <Text style={styles.stepDescription}>List your key skills and competencies</Text>
      
      {formData.skills.map((skill, index) => (
        <View key={index} style={styles.skillRow}>
          <TextInput
            style={styles.skillInput}
            value={skill}
            onChangeText={(v) => updateSkill(index, v)}
            placeholder={`Skill ${index + 1}`}
            placeholderTextColor={COLORS.textMuted}
          />
          {formData.skills.length > 1 && (
            <TouchableOpacity onPress={() => removeSkill(index)}>
              <Text style={styles.removeSkill}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      <TouchableOpacity style={styles.addButton} onPress={addSkill}>
        <Text style={styles.addButtonText}>+ Add Skill</Text>
      </TouchableOpacity>
      
      {/* Skills Preview */}
      <View style={styles.skillsPreview}>
        <Text style={styles.skillsPreviewTitle}>Preview:</Text>
        <View style={styles.skillsPreviewList}>
          {formData.skills.filter(s => s.trim()).map((skill, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // Step 5: Target Job with URL Scraping
  const renderTargetJob = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>🎯 Target Job (Optional)</Text>
      <Text style={styles.stepDescription}>Add a job description to tailor your resume with AI</Text>
      
      {/* Template Selection */}
      <Text style={styles.sectionLabel}>Choose Template</Text>
      {TEMPLATES.map((template) => (
        <TouchableOpacity
          key={template.value}
          style={[
            styles.templateCard,
            formData.template === template.value && [styles.templateCardSelected, { borderColor: template.color }],
          ]}
          onPress={() => handleChange('template', template.value)}
        >
          <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
            <Text style={styles.templateEmoji}>{template.icon}</Text>
          </View>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.label}</Text>
            <Text style={styles.templateDesc}>{template.description}</Text>
          </View>
          {formData.template === template.value && (
            <View style={[styles.checkmark, { backgroundColor: template.color }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
      
      <View style={styles.dividerSimple} />
      
      {/* Font Selection */}
      <Select
        label="Font Style"
        value={formData.font}
        onValueChange={(v) => handleChange('font', v)}
        options={FONTS.map(f => ({ value: f.value, label: `${f.label} - ${f.style}` }))}
      />
      
      <View style={styles.dividerSimple} />
      
      {/* Job URL Scraping */}
      <Text style={styles.sectionLabel}>Job Posting URL (Optional)</Text>
      <View style={styles.jobUrlRow}>
        <TextInput
          style={styles.jobUrlInput}
          value={formData.jobUrl}
          onChangeText={(v) => handleChange('jobUrl', v)}
          placeholder="https://linkedin.com/jobs/..."
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.scrapeButton}
          onPress={scrapeJobUrl}
          disabled={isScrapingJob}
        >
          {isScrapingJob ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.scrapeButtonText}>Extract</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <FormInput
        label="Job Description"
        value={formData.jobDescription}
        onChangeText={(v) => handleChange('jobDescription', v)}
        placeholder="Paste job description here to help AI tailor your resume..."
        multiline
        numberOfLines={6}
      />
    </View>
  );

  // Step 6: Preview
  const renderPreview = () => (
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

  // Progress indicator
  const renderProgress = () => {
    const stepNames = ['Info', 'Work', 'Edu', 'Skills', 'Job', 'Preview'];
    return (
      <View style={styles.progress}>
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <View key={step} style={styles.progressItem}>
            <TouchableOpacity
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive,
                currentStep === step && styles.progressDotCurrent,
              ]}
              onPress={() => step < currentStep && setCurrentStep(step)}
            >
              <Text style={[
                styles.progressDotText,
                currentStep >= step && styles.progressDotTextActive,
              ]}>
                {currentStep > step ? '✓' : step}
              </Text>
            </TouchableOpacity>
            {step < 6 && (
              <View style={[
                styles.progressLine,
                currentStep > step && styles.progressLineActive,
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

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
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onPress={currentStep === 5 ? generatePreview : handleNext} 
              loading={isLoading}
              style={{ backgroundColor: '#2563eb' }}
            >
              {currentStep === 5 ? 'Generate Preview' : 'Continue'}
            </Button>
          ) : (
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth 
              onPress={handleDownload} 
              loading={isLoading}
              style={{ backgroundColor: '#2563eb' }}
            >
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
  progressDotActive: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  progressDotCurrent: { backgroundColor: '#2563eb' },
  progressDotText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  progressDotTextActive: { color: '#2563eb' },
  progressLine: { width: 16, height: 2, backgroundColor: COLORS.border, marginHorizontal: 2 },
  progressLineActive: { backgroundColor: '#2563eb' },
  content: { flex: 1 },
  stepContent: { padding: SPACING.xl },
  stepTitle: { fontSize: FONT_SIZES.xxl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  stepDescription: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  
  // Upload Section
  uploadSection: { backgroundColor: '#f0f9ff', padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#bae6fd' },
  uploadTitle: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#0369a1', marginBottom: 4 },
  uploadDesc: { fontSize: FONT_SIZES.sm, color: '#0284c7', marginBottom: SPACING.md },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 2, borderColor: '#0ea5e9', borderStyle: 'dashed' },
  uploadButtonIcon: { fontSize: 20, marginRight: SPACING.sm },
  uploadButtonText: { color: '#0284c7', fontWeight: '600' },
  uploadedFile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  uploadedFileName: { color: '#0369a1', fontWeight: '500' },
  clearUpload: { color: COLORS.error, fontSize: 18, padding: 4 },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { paddingHorizontal: SPACING.md, color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  dividerSimple: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  
  row: { flexDirection: 'row', gap: SPACING.md },
  flex1: { flex: 1 },
  
  // Input Styles
  inputContainer: { marginBottom: SPACING.lg },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  required: { color: COLORS.error },
  textInput: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.lg, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  textInputDisabled: { backgroundColor: COLORS.background },
  
  // Experience Card
  experienceCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  experienceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  experienceNumber: { fontSize: FONT_SIZES.md, fontWeight: '600', color: '#2563eb' },
  removeButton: { fontSize: FONT_SIZES.sm, color: COLORS.error },
  
  checkboxRow: { marginBottom: SPACING.lg },
  
  // Responsibilities
  responsibilitiesSection: { marginTop: SPACING.md },
  responsibilitiesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  responsibilitiesLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textPrimary },
  aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9ff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: '#bae6fd' },
  aiButtonIcon: { fontSize: 14, marginRight: 4 },
  aiButtonText: { fontSize: FONT_SIZES.sm, color: '#0284c7', fontWeight: '500' },
  responsibilityRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  bulletPoint: { fontSize: 18, color: COLORS.textMuted, marginRight: 8, marginTop: 8 },
  responsibilityInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.sm, padding: SPACING.sm, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, minHeight: 40 },
  removeResponsibility: { color: COLORS.error, padding: 8 },
  addResponsibility: { alignItems: 'center', paddingVertical: SPACING.sm },
  addResponsibilityText: { color: '#2563eb', fontWeight: '500', fontSize: FONT_SIZES.sm },
  
  // Add Button
  addButton: { paddingVertical: SPACING.md, alignItems: 'center', borderWidth: 2, borderColor: '#2563eb', borderRadius: BORDER_RADIUS.md, borderStyle: 'dashed' },
  addButtonText: { color: '#2563eb', fontWeight: '600' },
  
  // Skills
  skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  skillInput: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingVertical: 10, paddingHorizontal: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  removeSkill: { color: COLORS.error, padding: 10, fontSize: 16 },
  skillsPreview: { marginTop: SPACING.xl, backgroundColor: COLORS.background, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg },
  skillsPreviewTitle: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  skillsPreviewList: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  skillChip: { backgroundColor: '#2563eb', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  skillChipText: { color: COLORS.white, fontSize: FONT_SIZES.sm },
  
  // Target Job
  sectionLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SPACING.md },
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.sm, borderWidth: 2, borderColor: COLORS.border },
  templateCardSelected: { backgroundColor: '#f0f9ff' },
  templateIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  templateEmoji: { fontSize: 20 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  templateDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  checkmark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkmarkText: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  
  jobUrlRow: { flexDirection: 'row', marginBottom: SPACING.lg },
  jobUrlInput: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderTopLeftRadius: BORDER_RADIUS.md, borderBottomLeftRadius: BORDER_RADIUS.md, paddingVertical: 12, paddingHorizontal: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  scrapeButton: { backgroundColor: '#2563eb', paddingHorizontal: SPACING.lg, alignItems: 'center', justifyContent: 'center', borderTopRightRadius: BORDER_RADIUS.md, borderBottomRightRadius: BORDER_RADIUS.md },
  scrapeButtonText: { color: COLORS.white, fontWeight: '600' },
  
  // Preview
  previewContainer: { flex: 1, padding: SPACING.lg },
  previewWebview: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginVertical: SPACING.md, minHeight: 450, ...SHADOWS.medium },
  webview: { flex: 1 },
  previewNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.warningBg, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  previewNoteIcon: { fontSize: 16, marginRight: SPACING.sm },
  previewNoteText: { flex: 1, fontSize: FONT_SIZES.sm, color: '#92400e' },
  
  actions: { padding: SPACING.lg, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
});
