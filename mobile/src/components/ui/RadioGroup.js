import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../constants/theme';

export default function RadioGroup({ 
  options = [], 
  value, 
  onChange,
  label,
  horizontal = false,
  disabled = false,
}) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.options, horizontal && styles.optionsHorizontal]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              horizontal && styles.optionHorizontal,
            ]}
            onPress={() => !disabled && onChange(option.value)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <View style={[
              styles.radio,
              value === option.value && styles.radioSelected,
              disabled && styles.radioDisabled,
            ]}>
              {value === option.value && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionLabel,
                disabled && styles.optionLabelDisabled,
              ]}>
                {option.label}
              </Text>
              {option.description && (
                <Text style={styles.optionDescription}>{option.description}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  options: {
    gap: SPACING.sm,
  },
  optionsHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  optionHorizontal: {
    marginRight: SPACING.xl,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDisabled: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionContent: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  optionLabelDisabled: {
    color: COLORS.textMuted,
  },
  optionDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
