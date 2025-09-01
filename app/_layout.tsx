import React, { useEffect, useState } from 'react';
import { Platform, SafeAreaView, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useGlobalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setupErrorLogging } from '../utils/errorLogger';
import { useExpenseStore } from '../stores/useExpenseStore';
import { createThemedStyles } from '../styles/commonStyles';
import { ThemeProvider } from '../contexts/ThemeContext';
import { autoBackupManager } from '../utils/autoBackup';

const STORAGE_KEY = 'mvault_emulate_device';

export default function RootLayout() {
  const { emulate } = useGlobalSearchParams();
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);
  const { loadData, profile } = useExpenseStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Setup error logging
        setupErrorLogging();
        
        // Load data from AsyncStorage
        console.log('Initializing app and loading data...');
        await loadData();
        
        // Initialize auto backup manager
        autoBackupManager.init();
        
        console.log('App initialized successfully');
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true); // Still set ready to avoid infinite loading
      }
    };

    initializeApp();
    
    // Cleanup on unmount
    return () => {
      autoBackupManager.cleanup();
    };
  }, [emulate]);

  if (!isReady) {
    return null; // Or a loading screen
  }

  const { theme } = profile;
  const styles = createThemedStyles(theme);
  
  return (
    <ThemeProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} translucent={true} />
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="setup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}