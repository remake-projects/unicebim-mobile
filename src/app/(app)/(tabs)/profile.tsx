import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { MenuRow } from '@/components/ui/menu-row';
import { Screen } from '@/components/ui/screen';
import { signOut } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/use-profile';
import { errorMessage } from '@/i18n/messages';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const profile = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut(); // the root guard returns to sign-in
    } catch (e) {
      setError(errorMessage(t, e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View>
        <ThemedText type="subtitle">{profile.data?.fullName ?? t('tabs.profile')}</ThemedText>
        <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>
      </View>
      <View>
        <MenuRow title={t('wallets.title')} subtitle={t('wallets.subtitle')} onPress={() => router.push('/wallets')} />
      </View>
      <FormMessage message={error} />
      <Button variant="secondary" title={t('auth.signOut')} loading={busy} onPress={onSignOut} />
    </Screen>
  );
}
