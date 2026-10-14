import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { resendConfirmation } from '@/features/auth/auth-api';
import { errorMessage } from '@/i18n/messages';

export default function CheckEmailScreen() {
  const { t } = useTranslation();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);

  async function onResend() {
    setSending(true);
    setMessage(null);
    try {
      await resendConfirmation(email);
      setMessage({ text: t('auth.checkEmail.resent'), tone: 'info' });
    } catch (error) {
      setMessage({ text: errorMessage(t, error), tone: 'error' });
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen centered>
      <ThemedText type="subtitle">{t('auth.checkEmail.title')}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('auth.checkEmail.body', { email })}</ThemedText>
      <FormMessage message={message?.text} tone={message?.tone} />
      {email ? (
        <Button variant="secondary" title={t('auth.checkEmail.resend')} loading={sending} onPress={onResend} />
      ) : null}
      <Button variant="ghost" title={t('auth.checkEmail.backToSignIn')} onPress={() => router.replace('/sign-in')} />
    </Screen>
  );
}
