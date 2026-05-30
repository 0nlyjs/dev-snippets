import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import React, { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { initDatabase } from '@/services/database';
import { initFolders, seedTemplates } from '@/services/filesystem';
import { ThemeProvider, useAppTheme } from '@/context/theme-context';

export default function TabLayout() {
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
    <ThemeProvider>
      <TabLayoutContent />
    </ThemeProvider>
  );
}

function TabLayoutContent() {
  const { colorScheme } = useAppTheme();

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </NavigationThemeProvider>
  );
}
