import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export type ThemeColors = {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  muted: string;
  white: string;
  black: string;
};

export const lightColors: ThemeColors = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#2c3e50',
  textSecondary: '#7f8c8d',
  border: '#e9ecef',
  muted: '#7f8c8d',
  white: '#ffffff',
  black: '#000000',
};

export const darkColors: ThemeColors = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  background: '#121212',
  card: '#1e1e1e',
  text: '#f8f9fa',
  textSecondary: '#a0a0a0',
  border: '#2c2c2c',
  muted: '#a0a0a0',
  white: '#ffffff',
  black: '#000000',
};

// For backward compatibility
export const colors = lightColors;

// Function to get theme colors based on theme name
export const getThemeColors = (theme: 'light' | 'dark'): ThemeColors => {
  return theme === 'light' ? lightColors : darkColors;
};

// Create styles for a specific theme
export const createThemedStyles = (theme: 'light' | 'dark') => {
  const colors = getThemeColors(theme);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 40,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    text: {
      fontSize: 16,
      color: colors.text,
    },
    textMuted: {
      fontSize: 14,
      color: colors.muted,
    },
  });
};

// For backward compatibility
export const commonStyles = createThemedStyles('light');