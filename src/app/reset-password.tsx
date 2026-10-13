import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Screen } from '@/components/ui/screen';
import { newPasswordSchema, type NewPasswordInput } from '@/core/schemas/auth';
import { updatePassword } from '@/features/auth/auth-api';
import { AuthFailure } from '@/features/auth/auth-errors';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ newPassword }) => {
    setServerError(null);
    try {
      await updatePassword(newPassword);
      router.replace('/');
    } catch (error) {
      setServerError(t(`errors.${error instanceof AuthFailure ? error.key : 'generic'}`));
    }
  });

  return (
    <Screen>
      <FormTextField
        control={control}
        name="newPassword"
        label={t('auth.resetPassword.newPassword')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('auth.passwordConfirm')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormMessage message={serverError} />
      <Button title={t('auth.resetPassword.submit')} loading={formState.isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}
