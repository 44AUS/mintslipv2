import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const features = [
  {
    icon: 'document-text',
    title: 'Pay Stubs & W-2s',
    description: 'Generate professional documents instantly',
  },
  {
    icon: 'business',
    title: 'Bank Statements',
    description: 'Multiple bank templates available',
  },
  {
    icon: 'globe',
    title: 'Canadian Paystubs',
    description: 'Provincial tax calculations included',
  },
];

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.secondary.default} />
      <LinearGradient
        colors={[colors.secondary.default, colors.secondary.light, colors.secondary.default]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>✦</Text>
            </View>
            <Text style={styles.brandName}>MintSlip</Text>
            <Text style={styles.tagline}>Professional Document Generation</Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={feature.icon}
                    size={24}
                    color={colors.primary.light}
                  />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonsContainer}>
            <Button
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('Login')}
            >
              Sign In
            </Button>

            <View style={{ height: spacing.md }} />

            <Button
              variant="secondary"
              size="lg"
              onPress={() => navigation.navigate('Signup')}
            >
              Create Account
            </Button>

            <View style={{ height: spacing.md }} />

            <Button
              variant="ghost"
              onPress={() => navigation.navigate('Guest')}
            >
              Continue as Guest
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>By continuing, you agree to our</Text>
            <Text style={styles.footerLink}>Terms of Service & Privacy Policy</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary.default,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    ...shadows.green,
  },
  logoIcon: {
    fontSize: 36,
    color: colors.primary.foreground,
  },
  brandName: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.slate[800],
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: spacing['2xl'],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.base,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate[800],
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
  },
  buttonsContainer: {
    marginBottom: spacing.base,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate[400],
  },
  footerLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.light,
    fontWeight: typography.fontWeight.medium,
    marginTop: 4,
  },
});
