import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import Icon from './Icon';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getThemeColors } from '../styles/commonStyles';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  onAuthenticate: (pin: string) => Promise<boolean>;
  title?: string;
  subtitle?: string;
}

const PinModal: React.FC<PinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onAuthenticate,
  title = 'Enter PIN',
  subtitle = 'Please enter your 4-digit PIN to continue'
}) => {
  const { theme } = useTheme();
  const { styles: themedStyles, colors } = useThemedStyles(createStyles);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shakeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
    }
  }, [visible]);

  const handleNumberPress = (number: string) => {
    if (pin.length < 4) {
      const newPin = pin + number;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Auto-verify when 4 digits are entered
        setTimeout(async () => {
          try {
            const isAuthenticated = await onAuthenticate(newPin);
            if (isAuthenticated) {
              onSuccess(newPin); // Pass the PIN to the onSuccess callback
              onClose();
            } else {
              setError('Incorrect PIN');
              setPin('');
              shakeError();
            }
          } catch (error) {
            console.error('PIN authentication error:', error);
            setError('Authentication error');
            setPin('');
            shakeError();
          }
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'backspace']
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={themedStyles.overlay}>
        <Animated.View 
          style={[
            themedStyles.container,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          <View style={themedStyles.header}>
            <TouchableOpacity style={themedStyles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} style={themedStyles.closeIcon} />
            </TouchableOpacity>
          </View>

          <View style={themedStyles.content}>
            <View style={themedStyles.lockIcon}>
              <Icon name="lock-closed" size={48} style={themedStyles.lockIconStyle} />
            </View>
            
            <Text style={themedStyles.title}>{title}</Text>
            <Text style={themedStyles.subtitle}>{subtitle}</Text>

            {error ? (
              <Text style={themedStyles.errorText}>{error}</Text>
            ) : null}

            <View style={themedStyles.pinDisplay}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    themedStyles.pinDot,
                    pin.length > index && themedStyles.pinDotFilled
                  ]}
                />
              ))}
            </View>

            <View style={themedStyles.keypad}>
              {numbers.map((row, rowIndex) => (
                <View key={rowIndex} style={themedStyles.keypadRow}>
                  {row.map((number, colIndex) => (
                    <TouchableOpacity
                      key={colIndex}
                      style={[
                        themedStyles.keypadButton,
                        number === '' && themedStyles.keypadButtonEmpty
                      ]}
                      onPress={() => {
                        if (number === 'backspace') {
                          handleBackspace();
                        } else if (number !== '') {
                          handleNumberPress(number);
                        }
                      }}
                      disabled={number === ''}
                    >
                      {number === 'backspace' ? (
                        <Icon name="backspace" size={24} style={themedStyles.backspaceIcon} />
                      ) : (
                        <Text style={themedStyles.keypadButtonText}>{number}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Create themed styles function
const createStyles = (colors, isDark) => ({
  overlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    color: colors.textSecondary,
  },
  content: {
    alignItems: 'center',
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lockIconStyle: {
    color: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 10,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  keypad: {
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  keypadButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: isDark ? colors.cardDark : colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  backspaceIcon: {
    color: colors.textSecondary,
  },
});

// For backward compatibility
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    color: '#7f8c8d',
  },
  content: {
    alignItems: 'center',
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: getThemeColors('light').primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockIconStyle: {
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 10,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: getThemeColors('light').primary,
    borderColor: getThemeColors('light').primary,
  },
  keypad: {
    width: '100%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  keypadButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  keypadButtonEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
  },
  backspaceIcon: {
    color: '#7f8c8d',
  },
});

export default PinModal;