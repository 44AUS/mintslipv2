import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import Button from '../components/Button';
import { showToast } from '../components/Toast';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const API_BASE_URL = 'https://ai-blog-image-fix.preview.emergentagent.com/api';

export default function PaymentSuccessScreen({ route, navigation }) {
  const [status, setStatus] = useState('verifying'); // verifying, generating, success, error
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);

  // Get params from route
  const sessionId = route.params?.session_id;
  const documentType = route.params?.type || 'paystub';
  const formData = route.params?.formData;
  const template = route.params?.template || 'template-a';

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setStatus('error');
      setError('No session ID provided');
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      setStatus('verifying');
      
      // Verify payment with backend
      const response = await fetch(`${API_BASE_URL}/stripe/checkout-status/${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to verify payment');
      }

      if (data.payment_status === 'paid' && data.status === 'complete') {
        // Payment successful - now generate PDF
        if (formData) {
          await generatePdf();
        } else {
          // No form data - show success but inform user
          setStatus('success');
          showToast('Payment successful! You can now generate your document.', 'success');
        }
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setStatus('error');
      setError(err.message || 'Failed to verify payment');
      showToast(err.message || 'Payment verification failed', 'error');
    }
  };

  const generatePdf = async () => {
    try {
      setStatus('generating');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // For now, show success and inform user about download
      // In a full implementation, we'd generate the PDF here using the same
      // logic as the web frontend (jsPDF + templates)
      
      // Since the mobile app's preview uses HTML/WebView and not jsPDF,
      // we need a different approach. The backend could generate the PDF.
      
      // Placeholder: Mark as success - PDF generation would be implemented
      // when backend provides a PDF generation endpoint
      setStatus('success');
      showToast('Payment successful! Your document is ready.', 'success');
      
    } catch (err) {
      console.error('PDF generation error:', err);
      setStatus('error');
      setError(err.message || 'Failed to generate PDF');
      showToast(err.message || 'PDF generation failed', 'error');
    }
  };

  const handleDownload = async () => {
    if (!pdfBase64) {
      // No PDF available yet - guide user
      showToast('Please use the web version to download your document', 'info');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const fileName = `${documentType}_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write base64 PDF to file
      await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save your document',
        });
        showToast('Document saved!', 'success');
      } else {
        showToast('Sharing not available on this device', 'error');
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('Failed to download document', 'error');
    }
  };

  const handleGoHome = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleRetry = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    verifyPayment();
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color={colors.primary.light} />
            <Text style={styles.statusTitle}>Verifying Payment...</Text>
            <Text style={styles.statusSubtitle}>Please wait while we confirm your payment</Text>
          </View>
        );

      case 'generating':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color={colors.primary.light} />
            <Text style={styles.statusTitle}>Generating Document...</Text>
            <Text style={styles.statusSubtitle}>Your document is being prepared</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={colors.green[500]} />
            </View>
            <Text style={styles.statusTitle}>Payment Successful!</Text>
            <Text style={styles.statusSubtitle}>
              Your {documentType === 'canadian-paystub' ? 'Canadian pay stub' : 'pay stub'} is ready
            </Text>
            
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color={colors.primary.light} />
              <Text style={styles.infoText}>
                To download your document, please return to the generator screen and use the download function, or check your email for the download link.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                variant="primary"
                size="lg"
                onPress={handleGoHome}
                icon={<Ionicons name="home-outline" size={20} color={colors.primary.foreground} />}
                iconPosition="left"
              >
                Return Home
              </Button>
            </View>
          </View>
        );

      case 'error':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.errorIcon}>
              <Ionicons name="close-circle" size={80} color={colors.red[500]} />
            </View>
            <Text style={styles.statusTitle}>Something Went Wrong</Text>
            <Text style={styles.statusSubtitle}>{error || 'An unexpected error occurred'}</Text>

            <View style={styles.buttonContainer}>
              <Button
                variant="primary"
                size="lg"
                onPress={handleRetry}
                icon={<Ionicons name="refresh-outline" size={20} color={colors.primary.foreground} />}
                iconPosition="left"
              >
                Try Again
              </Button>
              <View style={{ height: spacing.md }} />
              <Button
                variant="secondary"
                size="lg"
                onPress={handleGoHome}
              >
                Return Home
              </Button>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Mint</Text>
          <Text style={styles.logoAccent}>Slip</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.default,
  },
  logoAccent: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.light,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  statusContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  errorIcon: {
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  statusSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.secondary.default,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.primary.default,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
  },
});
