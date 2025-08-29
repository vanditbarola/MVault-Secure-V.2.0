import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { getThemeColors } from '../styles/commonStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

interface ButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export default function Button({ text, onPress, style, textStyle }: ButtonProps) {
  const { theme } = useTheme();
  const { styles: themedStyles, colors } = useThemedStyles(createStyles);
  
  return (
    <TouchableOpacity style={[themedStyles.button, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[themedStyles.buttonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
}

// Create themed styles function
const createStyles = (colors, isDark) => ({
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    elevation: 5,
    shadowColor: isDark ? colors.black : colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// For backward compatibility
const styles = StyleSheet.create({
  button: {
    backgroundColor: getThemeColors('light').primary,
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
