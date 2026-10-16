import '@/i18n';
import '@/lib/online';

import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { OfflineBanner } from '@/components/offline-banner';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { configureNotifications } from '@/features/reminders/notifications';
import { CACHE_MAX_AGE, queryClient } from '@/lib/query-client';
import { cacheBuster, queryPersister } from '@/lib/query-persistence';

SplashScreen.preventAutoHideAsync();
configureNotifications();

export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryProvider>
        <RootNavigator />
      </QueryProvider>
    </AuthProvider>
  );
}

/**
 * Signed in, the query cache is saved on the device and restored on the next start (offline
 * reading). The buster ties the saved cache to the user, so another account never sees it.
 */
function QueryProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id;
  if (!userId) return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return (
    <PersistQueryClientProvider
      key={userId}
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: CACHE_MAX_AGE, buster: cacheBuster(userId) }}>
      {children}
    </PersistQueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Signed in */}
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        {/* Signed out */}
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* E-mail links (confirmation, password reset) open here in either state. */}
        <Stack.Screen name="auth/callback" />
      </Stack>
      <OfflineBanner />
    </ThemeProvider>
  );
}
