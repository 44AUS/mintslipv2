import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';

export default function SectionHeader({
  title,
  subtitle,
  collapsible = false,
  isExpanded = true,
  onToggle,
  action,
  actionText,
  onAction,
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={collapsible ? onToggle : undefined}
        disabled={!collapsible}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.actions}>
          {action && (
            <TouchableOpacity onPress={onAction} style={styles.actionButton}>
              <Text style={styles.actionText}>{actionText}</Text>
            </TouchableOpacity>
          )}
          {collapsible && (
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.slate[500]}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.default,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: spacing.sm,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.light,
    fontWeight: typography.fontWeight.medium,
  },
});
