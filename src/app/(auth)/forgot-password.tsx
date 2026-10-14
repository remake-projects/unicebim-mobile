import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Screen } from '@/components/ui/screen';
import { resetPasswordRequestSchema } from '@/core/schemas/auth';
import { requestPasswordReset } from '@/features/auth/auth-api';
import { errorMessage } from '@/i18n/messages';

type Values = z.output<typeof resetPasswordRequestSchema>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setMessage(null);
    try {
      await requestPasswordReset(email);
      setMessage({ text: t('auth.forgotPassword.sent'), tone: 'info' });
    } catch (error) {
      setMessage({ text: errorMessage(t, error), tone: 'error' });
    }
  });

  return (
    <Screen centered>
      <ThemedText type="subtitle">{t('auth.forgotPassword.title')}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('auth.forgotPassword.subtitle')}</ThemedText>
      <FormTextField
        control={control}
        name="email"
        label={t('auth.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        onSubmitEditing={onSubmit}
      />
      <FormMessage message={message?.text} tone={message?.tone} />
      <Button title={t('auth.forgotPassword.submit')} loading={formState.isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}
