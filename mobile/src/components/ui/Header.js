import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function Header({ 
  title = 'MintSlip',
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  rightIcon,
  variant = 'default',
}) {
  const isLight = variant === 'light';

  return (
    <SafeAreaView style={[styles.safeArea, isLight && styles.safeAreaLight]}>
      <View style={[styles.container, isLight && styles.containerLight]}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backIcon, isLight && styles.textLight]}>←</Text>
            </TouchableOpacity>
          )}
          <View>
            <Text style={[styles.title, isLight && styles.titleLight]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, isLight && styles.subtitleLight]}>{subtitle}</Text>}
          </View>
        </View>
        {rightAction && (
          <TouchableOpacity onPress={rightAction} style={styles.rightButton}>
            {rightIcon || <Text style={[styles.rightText, isLight && styles.textLight]}>☰</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeAreaLight: {
    backgroundColor: COLORS.white,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.small,
  },
  containerLight: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.md,
    padding: SPACING.sm,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '300',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  titleLight: {
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  subtitleLight: {
    color: COLORS.textSecondary,
  },
  rightButton: {
    padding: SPACING.sm,
  },
  rightText: {
    fontSize: 24,
    color: COLORS.white,
  },
  textLight: {
    color: COLORS.textPrimary,
  },
});
