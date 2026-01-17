import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

const documentTypes = [
  {
    id: 'paystub',
    title: 'US Pay Stub',
    description: 'Generate professional pay stubs with accurate federal & state tax calculations',
    icon: 'document-text',
    screen: 'PaystubGenerator',
    flag: '🇺🇸',
  },
  {
    id: 'canadian-paystub',
    title: 'Canadian Pay Stub',
    description: 'Create pay stubs with provincial tax calculations for all Canadian provinces',
    icon: 'document-text',
    screen: 'CanadianPaystubGenerator',
    flag: '🇨🇦',
  },
];

export default function HomeScreen({ navigation }) {
  const { user, isAuthenticated, isGuest, logout } = useAuth();

  const handleDocumentPress = (screen) => {
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.secondary.default, colors.background]}
        style={styles.headerGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoSmall}>
              <Text style={styles.logoIconSmall}>✦</Text>
            </View>
            <Text style={styles.headerTitle}>MintSlip</Text>
          </View>
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="person-circle-outline" size={28} color={colors.slate[600]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {isAuthenticated ? `Welcome, ${user?.name?.split(' ')[0] || 'User'}!` : 'Welcome!'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {isGuest
              ? 'Generate professional documents instantly'
              : 'Your professional document generator'}
          </Text>
        </View>

        {/* Subscription Badge */}
        {isAuthenticated && user?.subscription?.status === 'active' && (
          <View style={styles.subscriptionBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary.light} />
            <Text style={styles.subscriptionText}>
              {user.subscription.tier?.charAt(0).toUpperCase() + user.subscription.tier?.slice(1)} Plan
              {user.subscription.downloads_remaining !== -1 && (
                ` • ${user.subscription.downloads_remaining} downloads left`
              )}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Types */}
        <Text style={styles.sectionTitle}>Generate Documents</Text>
        
        {documentTypes.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={styles.documentCard}
            onPress={() => handleDocumentPress(doc.screen)}
            activeOpacity={0.8}
          >
            <View style={styles.documentIcon}>
              <Text style={styles.documentFlag}>{doc.flag}</Text>
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>{doc.title}</Text>
              <Text style={styles.documentDescription}>{doc.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.slate[400]} />
          </TouchableOpacity>
        ))}

        {/* Guest Prompt */}
        {isGuest && (
          <View style={styles.guestPrompt}>
            <Ionicons name="information-circle" size={24} color={colors.primary.light} />
            <View style={styles.guestPromptText}>
              <Text style={styles.guestPromptTitle}>Create an account to save</Text>
              <Text style={styles.guestPromptDesc}>
                Sign up to save documents, get discounts, and access your download history
              </Text>
            </View>
            <Button
              variant="primary"
              size="sm"
              onPress={() => navigation.navigate('Signup')}
              fullWidth={false}
            >
              Sign Up
            </Button>
          </View>
        )}

        {/* Quick Stats for Authenticated Users */}
        {isAuthenticated && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {user?.totalDocuments || 0}
              </Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {user?.subscription?.downloads_remaining === -1 ? '∞' : user?.subscription?.downloads_remaining || 0}
              </Text>
              <Text style={styles.statLabel}>Downloads Left</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  logoIconSmall: {
    fontSize: 18,
    color: colors.primary.foreground,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.slate[800],
  },
  profileButton: {
    padding: spacing.xs,
  },
  welcomeSection: {
    marginBottom: spacing.base,
  },
  welcomeTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.default,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.muted.foreground,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  subscriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.default,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate[800],
    marginBottom: spacing.base,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  documentIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  documentFlag: {
    fontSize: 28,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate[800],
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    lineHeight: 18,
  },
  guestPrompt: {
    flexDirection: 'column',
    backgroundColor: colors.secondary.default,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginTop: spacing.base,
    alignItems: 'center',
  },
  guestPromptText: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  guestPromptTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.default,
    marginBottom: 4,
    textAlign: 'center',
  },
  guestPromptDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.secondary.default,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.default,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    marginTop: spacing.xs,
  },
});
