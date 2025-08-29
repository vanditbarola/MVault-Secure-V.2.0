import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors, ThemeColors } from '../styles/commonStyles';

// Type for style creator functions
type StyleCreator<T> = (colors: ThemeColors, isDark: boolean) => T;

/**
 * Hook to create theme-aware styles
 * @param styleCreator Function that creates styles based on theme colors
 * @returns Memoized styles and theme information
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleCreator: StyleCreator<T>
) {
  const { theme, isDark } = useTheme();
  const colors = getThemeColors(theme);
  
  // Memoize styles to prevent unnecessary re-renders
  const styles = useMemo(() => {
    return StyleSheet.create(styleCreator(colors, isDark));
  }, [colors, isDark, styleCreator]);

  return { styles, colors, isDark, theme };
}