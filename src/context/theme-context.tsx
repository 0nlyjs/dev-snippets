import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { getThemePreference, setThemePreference as saveThemePreference, AppTheme } from '@/services/storage';
import { Colors } from '@/constants/theme';

interface ThemeContextType {
  theme: AppTheme; // 'light' | 'dark' | 'system'
  colorScheme: 'light' | 'dark'; // The resolved scheme ('light' or 'dark')
  colors: typeof Colors.light | typeof Colors.dark; // Active theme palette
  setTheme: (newTheme: AppTheme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<AppTheme>('system');
  const [resolvedScheme, setResolvedScheme] = useState<'light' | 'dark'>('light');

  // Load preferences from AsyncStorage on boot
  useEffect(() => {
    async function loadTheme() {
      const saved = await getThemePreference();
      setThemeState(saved);
    }
    loadTheme();
  }, []);

  // Dynamically resolve theme based on state changes or device system switches
  useEffect(() => {
    if (theme === 'system') {
      setResolvedScheme(deviceScheme === 'dark' ? 'dark' : 'light');
    } else {
      setResolvedScheme(theme);
    }
  }, [theme, deviceScheme]);

  const setTheme = async (newTheme: AppTheme) => {
    setThemeState(newTheme);
    await saveThemePreference(newTheme);
  };

  const colors = Colors[resolvedScheme];

  return (
    <ThemeContext.Provider value={{ theme, colorScheme: resolvedScheme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider context');
  }
  return context;
}
