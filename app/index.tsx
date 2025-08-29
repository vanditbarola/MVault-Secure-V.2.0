import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useExpenseStore } from '../stores/useExpenseStore';

export default function Index() {
  const { profile, loadData } = useExpenseStore();

  useEffect(() => {
    const checkSetup = async () => {
      await loadData();
      
      // Check if setup is complete
      if (!profile.isSetupComplete) {
        console.log('Setup not complete, redirecting to welcome');
        router.replace('/welcome');
      } else {
        console.log('Setup complete, redirecting to dashboard');
        router.replace('/(tabs)');
      }
    };

    checkSetup();
  }, []);

  return null;
}