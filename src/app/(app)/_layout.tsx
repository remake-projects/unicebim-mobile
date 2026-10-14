import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { anchor: '(tabs)' };

/** Signed-in navigator: the tabs plus stack screens and modal forms on top of them. */
export default function AppLayout() {
  const { t } = useTranslation();
  const modal = { presentation: 'modal' } as const;
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="transaction/new" options={{ ...modal, title: t('transactions.new') }} />
      <Stack.Screen name="transaction/[id]" options={{ ...modal, title: t('transactions.edit') }} />

      <Stack.Screen name="wallets/index" options={{ title: t('wallets.title') }} />
      <Stack.Screen name="wallets/[id]" options={{ title: '' }} />
      <Stack.Screen name="wallets/new" options={{ ...modal, title: t('wallets.new') }} />
      <Stack.Screen name="wallets/edit/[id]" options={{ ...modal, title: t('wallets.edit') }} />
      <Stack.Screen name="wallets/transfer" options={{ ...modal, title: t('wallets.transfer') }} />

      <Stack.Screen name="reset-password" options={{ ...modal, title: t('auth.resetPassword.title') }} />
    </Stack>
  );
}
