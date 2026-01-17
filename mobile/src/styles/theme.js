// MintSlip Design System - Native Mobile Theme
// Based on web frontend design guidelines

export const colors = {
  // Primary colors - Deep Forest Green
  primary: {
    default: '#1a4731',
    light: '#16a34a',
    foreground: '#ffffff',
  },
  // Secondary colors - Pale Mint
  secondary: {
    default: '#f0fdf4',
    light: '#dcfce7',
    foreground: '#1a4731',
  },
  // Accent - Electric Lime (for CTAs)
  accent: {
    default: '#ccff00',
    foreground: '#000000',
  },
  // Base colors
  background: '#ffffff',
  foreground: '#1a1a1a',
  paper: '#f8f9fa',
  // Muted colors
  muted: {
    default: '#f1f5f9',
    foreground: '#64748b',
  },
  // Slate scale for text
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Green scale
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Red scale for errors
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
  // Border
  border: '#e2e8f0',
  // Input
  input: '#e2e8f0',
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const borderRadius = {
  sm: 4,
  md: 6,
  base: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const typography = {
  // Font families (closest native equivalents)
  fontFamily: {
    heading: 'System', // Will use system font, closest to Outfit
    body: 'System', // Will use system font, closest to Manrope
  },
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  // Font weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  green: {
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Common component styles
export const componentStyles = {
  // Card style
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    ...shadows.base,
  },
  // Input style
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.foreground,
  },
  inputFocused: {
    borderColor: colors.primary.default,
    borderWidth: 2,
  },
  // Button styles
  buttonPrimary: {
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.green,
  },
  buttonPrimaryText: {
    color: colors.primary.foreground,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonSecondary: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary.light,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    color: colors.primary.light,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonGhost: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhostText: {
    color: colors.muted.foreground,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  // Label style
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate[700],
    marginBottom: spacing.xs,
  },
  // Section header
  sectionHeader: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.default,
    marginBottom: spacing.sm,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  componentStyles,
};
