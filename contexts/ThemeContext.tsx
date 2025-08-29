import React, { createContext, useContext, ReactNode } from 'react';
import { useExpenseStore } from '../stores/useExpenseStore';

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { profile, setProfile } = useExpenseStore();
  
  const toggleTheme = () => {
    const newTheme = profile.theme === 'light' ? 'dark' : 'light';
    setProfile({ ...profile, theme: newTheme });
  };

  const value = {
    theme: profile.theme,
    toggleTheme,
    isDark: profile.theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};