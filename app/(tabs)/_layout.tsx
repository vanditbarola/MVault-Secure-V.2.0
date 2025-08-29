import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import Icon from '../../components/Icon';
import { useTheme } from '../../contexts/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export default function TabLayout() {
  const { theme } = useTheme();
  const { styles: themedStyles, colors } = useThemedStyles(createStyles);
  const isDark = theme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" size={size} style={{ color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color, size }) => (
              <Icon name="bar-chart" size={size} style={{ color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Add Transaction',
            tabBarIcon: ({ color, size }) => (
              <Icon name="add" size={size} style={{ color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <Icon name="list" size={size} style={{ color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Icon name="settings" size={size} style={{ color }} />
            ),
          }}
        />
      </Tabs>

    </View>
  );
}

// Create themed styles function
const createStyles = (colors, isDark) => ({});


// For backward compatibility
const styles = StyleSheet.create({});