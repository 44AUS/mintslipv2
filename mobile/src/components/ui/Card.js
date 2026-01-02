import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

export function Card({ children, style, variant = 'default', onPress }) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.card, SHADOWS.medium, style];
      case 'outlined':
        return [styles.card, styles.outlined, style];
      case 'filled':
        return [styles.card, styles.filled, style];
      default:
        return [styles.card, SHADOWS.small, style];
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getVariantStyle()}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getVariantStyle()}>{children}</View>;
}

export function CardHeader({ children, style }) {
  return <View style={[styles.header, style]}>{children}</View>;
}

export function CardTitle({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function CardDescription({ children, style }) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

export function CardContent({ children, style }) {
  return <View style={[styles.content, style]}>{children}</View>;
}

export function CardFooter({ children, style }) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filled: {
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});
