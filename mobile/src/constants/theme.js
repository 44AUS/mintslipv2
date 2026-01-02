// MintSlip Theme - Modern Kikoff-Style Fintech Design
export const COLORS = {
  // Primary - Modern Green (Kikoff-inspired)
  primary: '#00C853',
  primaryDark: '#00A844',
  primaryLight: '#69F0AE',
  primarySoft: '#E8F5E9',
  
  // Background
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text
  text: '#1A1D1F',
  textSecondary: '#6F767E',
  textTertiary: '#9A9FA5',
  textInverse: '#FFFFFF',
  
  // Border & Dividers
  border: '#EFEFEF',
  borderLight: '#F4F4F4',
  divider: '#F0F0F0',
  
  // Status
  success: '#00C853',
  successSoft: '#E8F5E9',
  error: '#FF5252',
  errorSoft: '#FFEBEE',
  warning: '#FFB300',
  warningSoft: '#FFF8E1',
  info: '#2196F3',
  infoSoft: '#E3F2FD',
  
  // Accents
  purple: '#7C4DFF',
  purpleSoft: '#EDE7F6',
  blue: '#2196F3',
  blueSoft: '#E3F2FD',
  orange: '#FF9800',
  orangeSoft: '#FFF3E0',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
};

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  display: 48,
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
