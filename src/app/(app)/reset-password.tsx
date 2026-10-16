import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { newPasswordSchema, type NewPasswordInput } from '@/core/schemas/auth';
import { updatePassword } from '@/features/auth/auth-api';
import { useFormSubmit } from '@/hooks/use-form-submit';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { error, submit } = useFormSubmit(async ({ newPassword }: NewPasswordInput) => {
    await updatePassword(newPassword);
    router.replace('/');
  });
  const { control, handleSubmit, formState } = useForm<NewPasswordInput>({
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
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('auth.passwordConfirm')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <FormMessage message={error} />
      <Button title={t('auth.resetPassword.submit')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </Screen>
  );
}
