import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { exchangeAuthCode } from '@/features/auth/auth-api';
import { grantRecovery } from '@/features/auth/recovery';

type Params = { code?: string; error?: string };

/**
 * Target of e-mail links (unicebim://auth/callback?code=…). Supabase has already verified the
 * address before redirecting here; the code only signs this device in, and only works on the
 * device that requested it (PKCE). Opened elsewhere, the user is asked to sign in instead.
 */
export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const { code, error } = useLocalSearchParams<Params>();
  const [status, setStatus] = useState<'working' | 'signInRequired' | 'failed'>(
    error || !code ? 'failed' : 'working'
  );

  useEffect(() => {
    if (error || !code) return;
    exchangeAuthCode(code)
      .then((result) => {
        if (result === 'otherDevice') return setStatus('signInRequired');
        if (result === 'recovery') {
          grantRecovery();
          return router.replace('/reset-password');
        }
        router.replace('/');
      })
      .catch(() => setStatus('failed'));
  }, [code, error]);

  return (
    <Screen centered>
      {status === 'working' ? (
        <>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">{t('auth.callback.confirming')}</ThemedText>
        </>
      ) : (
        <>
          <ThemedText>
            {status === 'signInRequired' ? t('auth.callback.confirmedSignIn') : t('auth.callback.failed')}
          </ThemedText>
          <Button title={t('common.continue')} onPress={() => router.replace('/')} />
        </>
      )}
    </Screen>
  );
}
