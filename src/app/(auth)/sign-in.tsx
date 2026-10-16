import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BrandMark } from '@/components/brand-mark';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { focusNext, FormTextField, submitOnDone } from '@/components/ui/form-text-field';
import { Screen } from '@/components/ui/screen';
import { loginSchema, type LoginInput } from '@/core/schemas/auth';
import { signIn } from '@/features/auth/auth-api';
import { AuthFailure } from '@/features/auth/auth-errors';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState, setFocus } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await signIn(values); // the root guard switches to the app on success
    } catch (error) {
      const key = error instanceof AuthFailure ? error.key : 'generic';
      if (key === 'emailNotConfirmed') {
        router.push({ pathname: '/check-email', params: { email: values.email } });
        return;
      }
      setServerError(t(`errors.${key}`));
    }
  });

  return (
    <Screen centered>
      <BrandMark />
      <ThemedText type="subtitle">{t('auth.signIn.title')}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('auth.signIn.subtitle')}</ThemedText>

      <FormTextField
        control={control}
        name="email"
        label={t('auth.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        {...focusNext(setFocus, 'password')}
      />
      <FormTextField
        control={control}
        name="password"
        label={t('auth.password')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        {...submitOnDone(onSubmit)}
      />
      <FormMessage message={serverError} />
      <Button title={t('auth.signIn.submit')} loading={formState.isSubmitting} onPress={onSubmit} />

      <Link href="/forgot-password" asChild>
        <Button variant="ghost" title={t('auth.signIn.forgotPassword')} />
      </Link>
      <Link href="/sign-up" asChild>
        <Button variant="ghost" title={t('auth.signIn.noAccount')} />
      </Link>
    </Screen>
  );
}
