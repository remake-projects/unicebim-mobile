import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Screen } from '@/components/ui/screen';
import { registerSchema, type RegisterFormInput, type RegisterInput } from '@/core/schemas/auth';
import { signUp } from '@/features/auth/auth-api';
import { AuthFailure } from '@/features/auth/auth-errors';
import { validationMessage } from '@/i18n/messages';
import { getDeviceRegion } from '@/lib/region';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<RegisterFormInput, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', passwordConfirm: '', acceptTerms: false },
  });
  const terms = useController({ control, name: 'acceptTerms' });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { needsEmailConfirmation } = await signUp(values, getDeviceRegion(), [
        t('wallets.defaultCash'),
        t('wallets.defaultBank'),
      ]);
      if (needsEmailConfirmation) {
        router.replace({ pathname: '/check-email', params: { email: values.email } });
      }
      // Otherwise a session exists and the root guard opens the app.
    } catch (error) {
      setServerError(t(`errors.${error instanceof AuthFailure ? error.key : 'generic'}`));
    }
  });

  return (
    <Screen centered>
      <ThemedText type="subtitle">{t('auth.signUp.title')}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('auth.signUp.subtitle')}</ThemedText>

      <FormTextField control={control} name="fullName" label={t('auth.fullName')} autoComplete="name" textContentType="name" />
      <FormTextField
        control={control}
        name="email"
        label={t('auth.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label={t('auth.password')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="passwordConfirm"
        label={t('auth.passwordConfirm')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Checkbox
        label={t('auth.signUp.acceptTerms')}
        checked={terms.field.value}
        onChange={terms.field.onChange}
        error={validationMessage(t, terms.fieldState.error?.message)}
      />
      <FormMessage message={serverError} />
      <Button title={t('auth.signUp.submit')} loading={formState.isSubmitting} onPress={onSubmit} />
      <Button variant="ghost" title={t('auth.signUp.haveAccount')} onPress={() => router.back()} />
    </Screen>
  );
}
