import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

export default function Checkbox({ 
  checked, 
  onPress, 
  label,
  labelStyle,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !disabled && onPress(!checked)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        disabled && styles.checkboxDisabled,
      ]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && (
        <Text style={[
          styles.label,
          disabled && styles.labelDisabled,
          labelStyle,
        ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxDisabled: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  labelDisabled: {
    color: COLORS.textMuted,
  },
});
