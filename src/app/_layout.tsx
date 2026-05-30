import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { initDatabase } from '@/services/database';
import { initFolders, seedTemplates } from '@/services/filesystem';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    async function bootstrap() {
      try {
        await initDatabase();
        await initFolders();
        await seedTemplates();
      } catch (error) {
        console.error('Bootstrap error:', error);
      }
    }
    bootstrap();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
