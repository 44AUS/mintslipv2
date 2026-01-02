import React from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  SafeAreaView, Platform, StatusBar, Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Document types
const DOCUMENTS = [
  {
    id: 'paystub',
    title: 'Pay Stub',
    subtitle: 'US Employees',
    icon: '💵',
    screen: 'PaystubForm',
    gradient: ['#00C853', '#00A844'],
  },
  {
    id: 'canadian-paystub',
    title: 'Canadian Pay Stub',
    subtitle: 'CA Employees',
    icon: '🍁',
    screen: 'CanadianPaystubForm',
    gradient: ['#FF5252', '#D32F2F'],
  },
  {
    id: 'w2',
    title: 'W-2 Form',
    subtitle: 'Tax Documents',
    icon: '📋',
    screen: 'W2Form',
    gradient: ['#2196F3', '#1976D2'],
  },
  {
    id: 'resume',
    title: 'AI Resume',
    subtitle: 'Smart Builder',
    icon: '✨',
    screen: 'ResumeBuilder',
    gradient: ['#7C4DFF', '#651FFF'],
  },
];

export default function HomeScreen({ navigation }) {
  const { user, isGuest, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {isGuest ? 'Welcome' : `Hi, ${user?.name?.split(' ')[0] || 'there'}`}
            </Text>
            <Text style={styles.headerTitle}>MintSlip</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarButton}
            onPress={() => navigation.navigate(isGuest ? 'Login' : 'Profile')}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {isGuest ? '?' : (user?.name?.charAt(0)?.toUpperCase() || 'U')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Subscription Card */}
        {isSubscribed ? (
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscriptionCard}
          >
            <View style={styles.subscriptionContent}>
              <View style={styles.subscriptionBadge}>
                <Text style={styles.subscriptionBadgeText}>PRO</Text>
              </View>
              <Text style={styles.subscriptionTitle}>Active Subscription</Text>
              <Text style={styles.subscriptionDownloads}>
                {user?.subscription?.downloads_remaining === -1 
                  ? '∞ Unlimited Downloads' 
                  : `${user?.subscription?.downloads_remaining || 0} Downloads Left`}
              </Text>
            </View>
            <Text style={styles.subscriptionEmoji}>⭐</Text>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={styles.promoCard}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Unlock Unlimited Access</Text>
              <Text style={styles.promoSubtitle}>Save up to 60% with a subscription</Text>
            </View>
            <View style={styles.promoButton}>
              <Text style={styles.promoButtonText}>View Plans</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Create Document</Text>
        
        <View style={styles.documentsGrid}>
          {DOCUMENTS.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => navigation.navigate(doc.screen)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={doc.gradient}
                style={styles.documentIconBg}
              >
                <Text style={styles.documentIcon}>{doc.icon}</Text>
              </LinearGradient>
              <Text style={styles.documentTitle}>{doc.title}</Text>
              <Text style={styles.documentSubtitle}>{doc.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why MintSlip?</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: COLORS.successSoft }]}>
                <Text>⚡</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Instant Generation</Text>
                <Text style={styles.featureDesc}>Create documents in under 60 seconds</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: COLORS.blueSoft }]}>
                <Text>🔒</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Bank-Level Security</Text>
                <Text style={styles.featureDesc}>Your data is encrypted & never stored</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: COLORS.purpleSoft }]}>
                <Text>✨</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>AI-Powered</Text>
                <Text style={styles.featureDesc}>Smart autofill & recommendations</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Login Prompt for Guests */}
        {isGuest && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptTitle}>Save Your Progress</Text>
            <Text style={styles.loginPromptText}>
              Create a free account to access your documents from any device.
            </Text>
            <View style={styles.loginButtons}>
              <TouchableOpacity
                style={styles.loginButtonOutline}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginButtonOutlineText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginButtonFilled}
                onPress={() => navigation.navigate('Signup')}
              >
                <Text style={styles.loginButtonFilledText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 MintSlip</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.huge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  avatarButton: {
    padding: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  subscriptionCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionContent: {
    flex: 1,
  },
  subscriptionBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  subscriptionBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textInverse,
  },
  subscriptionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textInverse,
    marginBottom: 4,
  },
  subscriptionDownloads: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  subscriptionEmoji: {
    fontSize: 40,
  },
  promoCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  promoSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  promoButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  promoButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  documentCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  documentIconBg: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  documentIcon: {
    fontSize: 24,
  },
  documentTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  documentSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  featuresSection: {
    marginTop: SPACING.lg,
  },
  featuresList: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  loginPrompt: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginPromptTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  loginPromptText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  loginButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  loginButtonOutline: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  loginButtonOutlineText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loginButtonFilled: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  loginButtonFilledText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textInverse,
  },
  footer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
  },
});
