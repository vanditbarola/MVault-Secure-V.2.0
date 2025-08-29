import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from './Icon';

interface FloatingActionButtonProps {
  onPress?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onPress }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  // Add a background overlay when menu is open
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    // Use sequence for more fluid animation
    Animated.sequence([
      // First slightly scale down the button
      Animated.timing(animation, {
        toValue: isOpen ? 0.9 : 0.1,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Then spring to the final position
      Animated.spring(animation, {
        toValue,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    setIsOpen(!isOpen);
  };

  const handleAddTransaction = () => {
    setIsOpen(false);
    animation.setValue(0);
    router.push('/(tabs)/add');
  };

  // Enhanced rotation with bounce effect
  const rotation = {
    transform: [
      {
        rotate: animation.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ['0deg', '60deg', '45deg'], // Overshoot and settle
        }),
      },
    ],
  };

  // Scale effect for main button
  const scaleStyle = {
    transform: [
      {
        scale: animation.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [1, 0.9, 1.1, 1], // Slight pulse effect
        }),
      },
    ],
  };

  // Enhanced income button animation
  const incomeStyle = {
    opacity: animation,
    transform: [
      { 
        scale: animation.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0.8, 1.2, 0.9, 1], // Bounce effect
        }) 
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -140],
        }),
      },
    ],
  };

  // Enhanced expense button animation
  const expenseStyle = {
    opacity: animation,
    transform: [
      { 
        scale: animation.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0.8, 1.2, 0.9, 1], // Bounce effect
        }) 
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -90],
        }),
      },
    ],
  };

  // Enhanced borrow button animation with staggered timing
  const borrowStyle = {
    opacity: animation,
    transform: [
      { 
        scale: animation.interpolate({
          inputRange: [0, 0.3, 0.9, 1],
          outputRange: [0.8, 1.2, 0.9, 1], // Bounce effect
        }) 
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -90],
        }),
      },
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -70],
        }),
      },
    ],
  };

  // Enhanced lend button animation with staggered timing
  const lendStyle = {
    opacity: animation,
    transform: [
      { 
        scale: animation.interpolate({
          inputRange: [0, 0.4, 0.9, 1],
          outputRange: [0.8, 1.2, 0.9, 1], // Bounce effect
        }) 
      },
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40],
        }),
      },
      {
        translateX: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -70],
        }),
      },
    ],
  };

  const labelOpacity = animation;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Background Overlay */}
      <Animated.View 
        style={[styles.overlay, { opacity: fadeAnim }]} 
        pointerEvents={isOpen ? 'auto' : 'none'}
        onTouchStart={() => isOpen && toggleMenu()}
      />
      
      {/* Income Button */}
      <Animated.View style={[styles.actionButton, styles.secondaryButton, incomeStyle, { backgroundColor: '#4CAF50' }]} pointerEvents="box-none">
        <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
          <Text style={styles.labelText}>Income</Text>
        </Animated.View>
        <TouchableOpacity
          style={styles.actionButtonInner}
          onPress={() => {
            router.push({ pathname: '/add', params: { type: 'income' } });
            toggleMenu();
          }}
        >
          <Icon name="trending-up" size={20} style={{ color: '#fff' }} />
        </TouchableOpacity>
      </Animated.View>

      {/* Expense Button */}
      <Animated.View style={[styles.actionButton, styles.secondaryButton, expenseStyle, { backgroundColor: '#F44336' }]} pointerEvents="box-none">
        <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
          <Text style={styles.labelText}>Expense</Text>
        </Animated.View>
        <TouchableOpacity
          style={styles.actionButtonInner}
          onPress={() => {
            router.push({ pathname: '/add', params: { type: 'expense' } });
            toggleMenu();
          }}
        >
          <Icon name="trending-down" size={20} style={{ color: '#fff' }} />
        </TouchableOpacity>
      </Animated.View>

      {/* Borrow Button */}
      <Animated.View style={[styles.actionButton, styles.secondaryButton, borrowStyle, { backgroundColor: '#FF9800' }]} pointerEvents="box-none">
        <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
          <Text style={styles.labelText}>Borrow</Text>
        </Animated.View>
        <TouchableOpacity
          style={styles.actionButtonInner}
          onPress={() => {
            router.push({ pathname: '/add', params: { type: 'borrow' } });
            toggleMenu();
          }}
        >
          <Icon name="arrow-down-circle" size={20} style={{ color: '#fff' }} />
        </TouchableOpacity>
      </Animated.View>

      {/* Lend Button */}
      <Animated.View style={[styles.actionButton, styles.secondaryButton, lendStyle, { backgroundColor: '#2196F3' }]} pointerEvents="box-none">
        <Animated.View style={[styles.labelContainer, { opacity: labelOpacity }]}>
          <Text style={styles.labelText}>Lend</Text>
        </Animated.View>
        <TouchableOpacity
          style={styles.actionButtonInner}
          onPress={() => {
            router.push({ pathname: '/add', params: { type: 'lend' } });
            toggleMenu();
          }}
        >
          <Icon name="arrow-up-circle" size={20} style={{ color: '#fff' }} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main Button */}
      <Animated.View style={[styles.actionButton, styles.mainButton, scaleStyle]} pointerEvents="box-none">
        <TouchableOpacity onPress={toggleMenu} style={styles.actionButtonInner}>
          <Animated.View style={rotation}>
            <Icon name="add" size={24} style={{ color: '#fff' }} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  actionButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  actionButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: '#667eea',
    bottom: 0,
    right: 0,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    bottom: 0,
    right: 0,
  },
  labelContainer: {
    position: 'absolute',
    right: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FloatingActionButton;