import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, SHADOWS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

export default function Button({ 
  children, 
  onPress, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          button: { backgroundColor: disabled ? '#9ca3af' : COLORS.primary },
          text: { color: COLORS.white },
        };
      case 'secondary':
        return {
          button: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
          text: { color: COLORS.textPrimary },
        };
      case 'outline':
        return {
          button: { backgroundColor: 'transparent', borderWidth: 2, borderColor: COLORS.primary },
          text: { color: COLORS.primary },
        };
      case 'ghost':
        return {
          button: { backgroundColor: 'transparent' },
          text: { color: COLORS.textSecondary },
        };
      case 'danger':
        return {
          button: { backgroundColor: disabled ? '#fca5a5' : COLORS.error },
          text: { color: COLORS.white },
        };
      case 'success':
        return {
          button: { backgroundColor: disabled ? '#86efac' : COLORS.success },
          text: { color: COLORS.white },
        };
      default:
        return {
          button: { backgroundColor: COLORS.primary },
          text: { color: COLORS.white },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          button: { paddingVertical: 8, paddingHorizontal: 12 },
          text: { fontSize: FONT_SIZES.sm },
        };
      case 'md':
        return {
          button: { paddingVertical: 12, paddingHorizontal: 16 },
          text: { fontSize: FONT_SIZES.md },
        };
      case 'lg':
        return {
          button: { paddingVertical: 14, paddingHorizontal: 20 },
          text: { fontSize: FONT_SIZES.lg },
        };
      case 'xl':
        return {
          button: { paddingVertical: 16, paddingHorizontal: 24 },
          text: { fontSize: FONT_SIZES.xl },
        };
      default:
        return {
          button: { paddingVertical: 12, paddingHorizontal: 16 },
          text: { fontSize: FONT_SIZES.md },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles.button,
        fullWidth && styles.fullWidth,
        variant === 'primary' && !disabled && SHADOWS.small,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
            {children}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
