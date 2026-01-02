import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Header } from '../components/ui';

export default function PreviewScreen({ navigation, route }) {
  const { htmlContent, title = 'Preview', onDownload, onPay } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header 
        title={title}
        showBack
        onBack={() => navigation.goBack()}
        variant="light"
      />
      
      <View style={styles.container}>
        {/* Preview Area */}
        <View style={styles.previewContainer}>
          {htmlContent ? (
            <WebView
              source={{ html: htmlContent }}
              style={styles.webview}
              scalesPageToFit={true}
              showsVerticalScrollIndicator={true}
              originWhitelist={['*']}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📄</Text>
              <Text style={styles.placeholderText}>Preview will appear here</Text>
            </View>
          )}
        </View>

        {/* Watermark Notice */}
        <View style={styles.watermarkNotice}>
          <Text style={styles.watermarkIcon}>⚠️</Text>
          <Text style={styles.watermarkText}>
            Preview contains watermarks. Final document will be clean.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {onDownload && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={onDownload}
            >
              Download PDF
            </Button>
          )}
          {onPay && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={onPay}
              style={styles.payButton}
            >
              Pay & Download
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  previewContainer: {
    flex: 1,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  placeholderText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  watermarkNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  watermarkIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  watermarkText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
  },
  actions: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payButton: {
    marginTop: SPACING.md,
  },
});
