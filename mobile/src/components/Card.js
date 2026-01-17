import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export default function Card({
  children,
  title,
  subtitle,
  onPress,
  style,
  contentStyle,
  variant = 'default', // 'default', 'outlined', 'elevated'
}) {
  const getCardStyle = () => {
    const variantStyles = {
      default: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
      },
      outlined: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      },
      elevated: {
        backgroundColor: colors.background,
        ...shadows.md,
      },
    };

    return [
      styles.card,
      variantStyles[variant],
      style,
    ];
  };

  const content = (
    <View style={getCardStyle()}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.muted.foreground,
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.base,
  },
});
