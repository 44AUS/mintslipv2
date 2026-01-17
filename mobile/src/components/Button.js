import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export default function Button({
  children,
  onPress,
  variant = 'primary', // 'primary', 'secondary', 'ghost', 'accent'
  size = 'default', // 'sm', 'default', 'lg'
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}) {
  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Haptic feedback for button press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    const sizeStyles = {
      sm: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        minHeight: 36,
      },
      default: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: 48,
      },
      lg: {
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.xl,
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: colors.primary.light,
        ...shadows.green,
      },
      secondary: {
        backgroundColor: colors.background,
        borderWidth: 2,
        borderColor: colors.primary.light,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      accent: {
        backgroundColor: colors.accent.default,
        ...shadows.md,
      },
    };

    const disabledStyle = disabled ? {
      opacity: 0.5,
    } : {};

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      fullWidth && { width: '100%' },
      disabledStyle,
      style,
    ];
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: typography.fontWeight.semibold,
    };

    const sizeTextStyles = {
      sm: {
        fontSize: typography.fontSize.sm,
      },
      default: {
        fontSize: typography.fontSize.base,
      },
      lg: {
        fontSize: typography.fontSize.lg,
      },
    };

    const variantTextStyles = {
      primary: {
        color: colors.primary.foreground,
      },
      secondary: {
        color: colors.primary.light,
      },
      ghost: {
        color: colors.muted.foreground,
      },
      accent: {
        color: colors.accent.foreground,
      },
    };

    return [
      baseTextStyle,
      sizeTextStyles[size],
      variantTextStyles[variant],
      textStyle,
    ];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.primary.foreground : colors.primary.light}
        />
      );
    }

    const content = (
      <>
        {icon && iconPosition === 'left' && (
          <View style={{ marginRight: spacing.sm }}>{icon}</View>
        )}
        <Text style={getTextStyle()}>{children}</Text>
        {icon && iconPosition === 'right' && (
          <View style={{ marginLeft: spacing.sm }}>{icon}</View>
        )}
      </>
    );

    return content;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={getButtonStyle()}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}
