import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { signOut } from '@/features/auth/auth-api';
import { AuthFailure } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/auth-provider';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut(); // the root guard returns to sign-in
    } catch (e) {
      setError(t(`errors.${e instanceof AuthFailure ? e.key : 'generic'}`));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ThemedText type="subtitle">{t('tabs.profile')}</ThemedText>
      <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('common.comingSoon')}</ThemedText>
      <FormMessage message={error} />
      <Button variant="secondary" title={t('auth.signOut')} loading={busy} onPress={onSignOut} />
    </Screen>
  );
}
