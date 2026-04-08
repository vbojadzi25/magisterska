export const theme = {
  colors: {
    // Primary green theme inspired by money/nature
    primary: '#00C851', // Bright green
    primaryDark: '#007E33', // Dark green
    primaryLight: '#66D593', // Light green

    // Secondary colors
    secondary: '#33B679', // Medium green
    accent: '#4CAF50', // Material green

    // Backgrounds
    background: '#FFFFFF',
    surface: '#F8FFF8', // Very light green tint
    surfaceVariant: '#E8F5E8',

    // Text
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1B1B1B',
    onSurface: '#1B1B1B',

    // Status colors
    success: '#00C851',
    warning: '#FF8A00',
    error: '#FF4444',
    info: '#33B5E5',

    // Grays
    gray: '#757575',
    lightGray: '#E0E0E0',
    darkGray: '#424242',

    // Borders
    border: '#E8F5E8',

    // Special
    money: '#00C851', // Green for money amounts
    request: '#FF8A00', // Orange for requests
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  },
};