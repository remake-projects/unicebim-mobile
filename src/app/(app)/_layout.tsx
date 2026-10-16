import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { LockScreen, useAppLock } from '@/features/app-lock/app-lock';
import { useProfileLanguage } from '@/features/profile/use-profile-language';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';

export const unstable_settings = { anchor: '(tabs)' };

/** Signed-in navigator: the tabs plus stack screens and modal forms on top of them. */
export default function AppLayout() {
  const { t } = useTranslation();
  useReminderSync();
  useProfileLanguage();
  const lock = useAppLock();
  if (lock.locked) return <LockScreen onUnlock={lock.unlock} />;
  const modal = { presentation: 'modal' } as const;
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="transaction/new" options={{ ...modal, title: t('transactions.new') }} />
      <Stack.Screen
        name="transaction/[id]"
        options={{ ...modal, title: t('transactions.edit') }}
      />

      <Stack.Screen name="wallets/index" options={{ title: t('wallets.title') }} />
      <Stack.Screen name="wallets/[id]" options={{ title: '' }} />
      <Stack.Screen name="wallets/new" options={{ ...modal, title: t('wallets.new') }} />
      <Stack.Screen name="wallets/edit/[id]" options={{ ...modal, title: t('wallets.edit') }} />
      <Stack.Screen
        name="wallets/transfer"
        options={{ ...modal, title: t('wallets.transfer') }}
      />

      <Stack.Screen name="payments/index" options={{ title: t('payments.title') }} />
      <Stack.Screen name="payments/new" options={{ ...modal, title: t('payments.new') }} />
      <Stack.Screen name="payments/[id]" options={{ ...modal, title: t('payments.edit') }} />
      <Stack.Screen
        name="payments/pay/[id]"
        options={{ ...modal, title: t('payments.payTitle') }}
      />

      <Stack.Screen name="subscriptions/index" options={{ title: t('subscriptions.title') }} />
      <Stack.Screen
        name="subscriptions/new"
        options={{ ...modal, title: t('subscriptions.new') }}
      />
      <Stack.Screen
        name="subscriptions/[id]"
        options={{ ...modal, title: t('subscriptions.edit') }}
      />

      <Stack.Screen name="fixed-expenses/index" options={{ title: t('fixedExpenses.title') }} />
      <Stack.Screen
        name="fixed-expenses/new"
        options={{ ...modal, title: t('fixedExpenses.new') }}
      />
      <Stack.Screen
        name="fixed-expenses/[id]"
        options={{ ...modal, title: t('fixedExpenses.edit') }}
      />

      <Stack.Screen name="settings/budget" options={{ ...modal, title: t('budget.title') }} />
      <Stack.Screen name="settings/profile" options={{ ...modal, title: t('profile.edit') }} />
      <Stack.Screen
        name="settings/password"
        options={{ ...modal, title: t('profile.changePassword') }}
      />
      <Stack.Screen name="settings/security" options={{ title: t('security.title') }} />
      <Stack.Screen name="settings/region" options={{ ...modal, title: t('region.title') }} />
      <Stack.Screen
        name="settings/delete-account"
        options={{ ...modal, title: t('profile.deleteAccount') }}
      />

      <Stack.Screen name="report" options={{ title: t('report.title') }} />
      <Stack.Screen name="bank-import" options={{ title: t('bankImport.title') }} />
      <Stack.Screen name="bill-splitter" options={{ title: t('billSplitter.title') }} />

      <Stack.Screen
        name="reset-password"
        options={{ ...modal, title: t('auth.resetPassword.title') }}
      />
    </Stack>
  );
}
