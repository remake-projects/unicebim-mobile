/**
 * Design tokens (light/dark). Palette follows the web app's slate theme.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#020817',
    background: '#ffffff',
    backgroundElement: '#f1f5f9',
    backgroundSelected: '#e2e8f0',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    primary: '#0f172a',
    onPrimary: '#f8fafc',
    danger: '#dc2626',
    success: '#059669',
    warning: '#d97706',
    // Headline card: the brand navy of the app icon in both modes.
    hero: '#0f172a',
    heroBorder: '#0f172a',
    onHero: '#f8fafc',
    heroNegative: '#fca5a5',
  },
  dark: {
    text: '#f8fafc',
    background: '#020817',
    backgroundElement: '#1e293b',
    backgroundSelected: '#334155',
    textSecondary: '#94a3b8',
    border: '#1e293b',
    primary: '#f8fafc',
    onPrimary: '#0f172a',
    danger: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    hero: '#0f172a',
    heroBorder: '#334155',
    onHero: '#f8fafc',
    heroNegative: '#fca5a5',
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

export const Radius = { sm: 8, md: 12, lg: 16, full: 999 } as const;
