import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { focusNext, FormTextField, submitOnDone } from '@/components/ui/form-text-field';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { changePasswordSchema, type ChangePasswordInput } from '@/core/schemas/auth';
import { changePassword } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/auth-provider';
import { useFormSubmit } from '@/hooks/use-form-submit';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { error, submit } = useFormSubmit(async (values: ChangePasswordInput) => {
    await changePassword(session?.user.email ?? '', values);
    Alert.alert(t('profile.passwordChanged'));
    router.back();
  });
  const { control, handleSubmit, formState, setFocus } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <FormTextField
        control={control}
        name="currentPassword"
        label={t('profile.currentPassword')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        {...focusNext(setFocus, 'newPassword')}
      />
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
      <Button title={t('profile.changePassword')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </Screen>
  );
}
