import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Signed in */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="reset-password"
            options={{ headerShown: true, title: t('auth.resetPassword.title'), presentation: 'modal' }}
          />
        </Stack.Protected>

        {/* Signed out */}
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* E-mail links (confirmation, password reset) open here in either state. */}
        <Stack.Screen name="auth/callback" />
      </Stack>
    </ThemeProvider>
  );
}
