import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { focusNext, FormTextField, submitOnDone } from '@/components/ui/form-text-field';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { newPasswordSchema, type NewPasswordInput } from '@/core/schemas/auth';
import { updatePassword } from '@/features/auth/auth-api';
import { hasRecoveryGrant, revokeRecovery } from '@/features/auth/recovery';
import { useFormSubmit } from '@/hooks/use-form-submit';

/** Only reachable from a password-recovery link (see features/auth/recovery). */
export default function ResetPasswordScreen() {
  const [allowed] = useState(hasRecoveryGrant);
  useEffect(() => revokeRecovery, []);
  // Everyone else changes the password with the current one.
  if (!allowed) return <Redirect href="/settings/password" />;
  return <NewPasswordForm />;
}

function NewPasswordForm() {
  const { t } = useTranslation();
  const { error, submit } = useFormSubmit(async ({ newPassword }: NewPasswordInput) => {
    await updatePassword(newPassword);
    router.replace('/');
  });
  const { control, handleSubmit, formState, setFocus } = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <FormTextField
        control={control}
        name="newPassword"
        label={t('auth.resetPassword.newPassword')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        {...focusNext(setFocus, 'confirmPassword')}
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('auth.passwordConfirm')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        {...submitOnDone(handleSubmit(submit))}
      />
      <FormMessage message={error} />
      <Button title={t('auth.resetPassword.submit')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </Screen>
  );
}
