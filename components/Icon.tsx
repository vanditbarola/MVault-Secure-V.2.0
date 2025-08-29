import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../styles/commonStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  style?: any;
}

export default function Icon({ name, size = 24, style }: IconProps) {
  const { theme } = useTheme();
  const { styles: themedStyles, colors } = useThemedStyles(createStyles);
  
  return (
    <View style={[themedStyles.container, style]}>
      <Ionicons name={name} size={size} color={style?.color || colors.primary} />
    </View>
  );
}

// Create themed styles function
const createStyles = (colors, isDark) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// For backward compatibility
const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});