import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

export default function Select({
  label,
  value,
  onValueChange,
  options = [], // [{ label: 'Option 1', value: 'opt1' }]
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  style,
  containerStyle,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  const handleOpen = async () => {
    if (disabled) return;
    await Haptics.selectionAsync();
    setIsOpen(true);
  };

  const handleSelect = async (option) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(option.value);
    setIsOpen(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.optionSelected,
      ]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionText,
          item.value === value && styles.optionTextSelected,
        ]}
      >
        {item.label}
      </Text>
      {item.value === value && (
        <Ionicons name="checkmark" size={20} color={colors.primary.light} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.selector,
          error && styles.selectorError,
          disabled && styles.selectorDisabled,
          style,
        ]}
        onPress={handleOpen}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedOption && styles.placeholderText,
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={colors.slate[400]}
        />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Select'}</Text>
                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.slate[600]} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => item.value.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.optionsList}
              />
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate[700],
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.red[500],
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  selectorError: {
    borderColor: colors.red[500],
  },
  selectorDisabled: {
    backgroundColor: colors.muted.default,
    opacity: 0.7,
  },
  selectorText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.foreground,
  },
  placeholderText: {
    color: colors.slate[400],
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.red[500],
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '70%',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.foreground,
  },
  closeButton: {
    padding: spacing.xs,
  },
  optionsList: {
    paddingVertical: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.secondary.default,
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: colors.foreground,
  },
  optionTextSelected: {
    color: colors.primary.default,
    fontWeight: typography.fontWeight.medium,
  },
});
