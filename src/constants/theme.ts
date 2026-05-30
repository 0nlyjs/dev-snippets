/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E1B4B', // Deep indigo night text (highly legible)
    background: '#FAF9FF', // Delicate lavender mist iridescent canvas
    backgroundElement: 'rgba(255, 255, 255, 0.78)', // Crisp semi-translucent white glass
    backgroundSelected: 'rgba(99, 102, 241, 0.14)', // Soft indigo-purple active glass tint
    textSecondary: '#6366F1', // Royal indigo highlight secondary text
    borderColor: 'rgba(99, 102, 241, 0.12)', // Delicate purple-tinted glass border
  },
  dark: {
    text: '#F5F3FF', // Ice-lavender glowing text (soothing to read)
    background: '#090714', // Deep space dark-violet background
    backgroundElement: 'rgba(22, 19, 49, 0.58)', // Rich translucent deep purple-indigo glass
    backgroundSelected: 'rgba(139, 92, 246, 0.28)', // Glowing active violet glass tint
    textSecondary: '#A5B4FC', // Ethereal lavender-indigo secondary text
    borderColor: 'rgba(139, 92, 246, 0.18)', // Subtle glowing purple glass border
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
