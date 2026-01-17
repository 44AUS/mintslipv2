import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { showToast } from '../components/Toast';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export default function SettingsScreen({ navigation }) {
  const { user, isAuthenticated, isGuest, logout } = useAuth();

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            showToast('Signed out successfully', 'success');
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      icon: 'person-outline',
      title: 'Account',
      subtitle: user?.email || 'Guest user',
      onPress: () => showToast('Account settings coming soon', 'info'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage your notifications',
      onPress: () => showToast('Notifications settings coming soon', 'info'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy',
      subtitle: 'Privacy and security settings',
      onPress: () => showToast('Privacy settings coming soon', 'info'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'FAQ and contact support',
      onPress: () => showToast('Help & Support coming soon', 'info'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'Version 1.0.0',
      onPress: () => showToast('MintSlip v1.0.0', 'info'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.slate[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        {isAuthenticated ? (
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {user?.subscription?.status === 'active' && (
                <View style={styles.planBadge}>
                  <Ionicons name="star" size={12} color={colors.primary.light} />
                  <Text style={styles.planText}>
                    {user.subscription.tier?.charAt(0).toUpperCase() + user.subscription.tier?.slice(1)} Plan
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Ionicons name="person-circle" size={48} color={colors.slate[400]} />
            <Text style={styles.guestTitle}>Guest User</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to access all features and save your documents
            </Text>
            <View style={{ height: spacing.md }} />
            <Button
              variant="primary"
              size="default"
              onPress={() => navigation.navigate('Login')}
              fullWidth={false}
              style={{ paddingHorizontal: spacing['2xl'] }}
            >
              Sign In
            </Button>
          </View>
        )}

        {/* Settings Options */}
        <View style={styles.optionsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={option.icon} size={22} color={colors.slate[600]} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.slate[400]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <Button
            variant="ghost"
            onPress={handleLogout}
            icon={<Ionicons name="log-out-outline" size={20} color={colors.red[500]} />}
            textStyle={{ color: colors.red[500] }}
          >
            Sign Out
          </Button>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MintSlip © 2025</Text>
          <Text style={styles.footerLinks}>
            Terms of Service • Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.default,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  profileInitial: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.foreground,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  profileEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    marginTop: 2,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  planText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.light,
    fontWeight: typography.fontWeight.medium,
    marginLeft: 4,
  },
  guestCard: {
    alignItems: 'center',
    backgroundColor: colors.muted.default,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  guestTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
    marginTop: spacing.md,
  },
  guestSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  optionsContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.base,
    backgroundColor: colors.muted.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.foreground,
  },
  optionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate[400],
    marginBottom: spacing.xs,
  },
  footerLinks: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.light,
  },
});
