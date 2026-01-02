import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS, SHADOWS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Document types available
const DOCUMENTS = [
  {
    id: 'paystub',
    title: 'Pay Stub',
    description: 'Generate professional pay stubs with accurate tax calculations for US employees.',
    icon: '💵',
    price: '$9.99',
    screen: 'PaystubForm',
    color: COLORS.primary,
    bgColor: COLORS.primaryBg,
  },
  {
    id: 'canadian-paystub',
    title: 'Canadian Pay Stub',
    description: 'Create Canadian pay stubs with provincial tax calculations and deductions.',
    icon: '🇨🇦',
    price: '$9.99',
    screen: 'CanadianPaystubForm',
    color: '#dc2626',
    bgColor: '#fef2f2',
  },
  {
    id: 'w2',
    title: 'W-2 Form',
    description: 'Generate W-2 wage and tax statements for year-end tax reporting.',
    icon: '📋',
    price: '$14.99',
    screen: 'W2Form',
    color: '#2563eb',
    bgColor: '#eff6ff',
  },
  {
    id: 'resume',
    title: 'AI Resume Builder',
    description: 'Create professional resumes with AI-powered suggestions and formatting.',
    icon: '📝',
    price: '$4.99',
    screen: 'ResumeBuilder',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
  },
];

export default function HomeScreen({ navigation }) {
  const { user, isGuest, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MintSlip</Text>
            <Text style={styles.tagline}>Professional Documents</Text>
          </View>
          {!isGuest && user && (
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Generate{`\n`}Professional{`\n`}Documents</Text>
            <Text style={styles.heroSubtitle}>
              Create pay stubs, tax forms, and resumes instantly. Simple, secure, and ready to download.
            </Text>
            
            {/* Feature Pills */}
            <View style={styles.pills}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>✓ Instant Download</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>✓ Secure Payment</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>✓ No Sign-up Required</Text>
              </View>
            </View>
          </View>

          {/* Subscription Banner (if user has subscription) */}
          {isSubscribed && (
            <View style={styles.subscriptionBanner}>
              <Text style={styles.subscriptionIcon}>⭐</Text>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTitle}>Active Subscription</Text>
                <Text style={styles.subscriptionText}>
                  {user.subscription.downloads_remaining === -1 
                    ? 'Unlimited downloads' 
                    : `${user.subscription.downloads_remaining} downloads remaining`}
                </Text>
              </View>
            </View>
          )}

          {/* Documents Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Document Type</Text>
            <Text style={styles.sectionSubtitle}>Select the document you need to create</Text>
            
            {/* Document Cards */}
            {DOCUMENTS.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.card}
                onPress={() => navigation.navigate(doc.screen)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIconContainer, { backgroundColor: doc.bgColor }]}>
                  <Text style={styles.cardIcon}>{doc.icon}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{doc.title}</Text>
                  <Text style={styles.cardDescription}>{doc.description}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardPrice, { color: doc.color }]}>
                      {isSubscribed ? 'Included' : doc.price}
                    </Text>
                    <View style={[styles.cardArrow, { backgroundColor: doc.bgColor }]}>
                      <Text style={[styles.arrowText, { color: doc.color }]}>→</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Guest Login Prompt */}
          {isGuest && (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptTitle}>Save Your Documents</Text>
              <Text style={styles.loginPromptText}>
                Create an account to access your documents anytime and get subscription benefits.
              </Text>
              <View style={styles.loginButtons}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signupButton}
                  onPress={() => navigation.navigate('Signup')}
                >
                  <Text style={styles.signupButtonText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Trust Section */}
          <View style={styles.trustSection}>
            <Text style={styles.trustTitle}>🔒 Secure & Private</Text>
            <Text style={styles.trustText}>
              Your data is encrypted and never stored after download. We use industry-standard security practices.
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 MintSlip. All rights reserved.</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  logo: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tagline: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  hero: {
    padding: SPACING.xl,
    paddingTop: SPACING.xxxl,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    lineHeight: 44,
    marginBottom: SPACING.lg,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pill: {
    backgroundColor: COLORS.primaryBg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  pillText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  subscriptionIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  subscriptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  cardDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPrompt: {
    backgroundColor: COLORS.background,
    margin: SPACING.xl,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  loginPromptTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  loginPromptText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  loginButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  loginButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  signupButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  trustSection: {
    backgroundColor: COLORS.background,
    margin: SPACING.xl,
    marginTop: 0,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  trustTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  trustText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
});
