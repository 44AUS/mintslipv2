import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Button, Header, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout, hasActiveSubscription } = useAuth();
  const isSubscribed = hasActiveSubscription();

  const handleLogout = () => {
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
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainTabs' }],
            });
          }
        },
      ]
    );
  };

  // Get subscription tier name
  const getTierName = () => {
    if (!user?.subscription?.tier) return 'None';
    const tier = user.subscription.tier;
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  // Get downloads remaining text
  const getDownloadsText = () => {
    if (!user?.subscription) return 'No subscription';
    const remaining = user.subscription.downloads_remaining;
    if (remaining === -1) return 'Unlimited';
    return `${remaining} remaining`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Profile" variant="light" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Subscription Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={[styles.subscriptionCard, isSubscribed && styles.subscriptionActive]}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionIcon}>{isSubscribed ? '⭐' : '💫'}</Text>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionTier}>
                  {isSubscribed ? getTierName() + ' Plan' : 'No Active Plan'}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {isSubscribed ? 'Active' : 'Upgrade to save more'}
                </Text>
              </View>
            </View>
            
            {isSubscribed && (
              <View style={styles.downloadsInfo}>
                <Text style={styles.downloadsLabel}>Downloads</Text>
                <Text style={styles.downloadsValue}>{getDownloadsText()}</Text>
              </View>
            )}
            
            {!isSubscribed && (
              <Button
                variant="primary"
                size="md"
                fullWidth
                style={styles.upgradeButton}
              >
                View Plans
              </Button>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuText}>My Documents</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💳</Text>
            <Text style={styles.menuText}>Purchase History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>Help Center</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📧</Text>
            <Text style={styles.menuText}>Contact Us</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.logoutSection}>
          <Button
            variant="danger"
            onPress={handleLogout}
            fullWidth
          >
            Sign Out
          </Button>
        </View>

        {/* App Version */}
        <Text style={styles.version}>MintSlip v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.white,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  subscriptionCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subscriptionActive: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primaryBorder,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTier: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  subscriptionStatus: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  downloadsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  downloadsLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  downloadsValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  upgradeButton: {
    marginTop: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
    width: 28,
  },
  menuText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  logoutSection: {
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  version: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    paddingBottom: SPACING.xxxl,
  },
});
