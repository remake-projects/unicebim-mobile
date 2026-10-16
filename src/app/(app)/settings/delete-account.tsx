import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField, submitOnDone } from '@/components/ui/form-text-field';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { deleteAccountSchema, type DeleteAccountInput } from '@/core/schemas/auth';
import { deleteAccount } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/auth-provider';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useTheme } from '@/hooks/use-theme';

/** Irreversible, so the password is asked again; an unlocked phone alone is not enough. */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session } = useAuth();
  // On success the session ends and the root guard shows sign-in.
  const { error, submit } = useFormSubmit(({ password }: DeleteAccountInput) =>
    deleteAccount(session?.user.email ?? '', password)
  );
  const { control, handleSubmit, formState } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  });
  const onSubmit = handleSubmit(submit);

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <Text style={[styles.title, { color: theme.text }]}>{t('profile.deleteAccountTitle')}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{t('profile.deleteAccountMessage')}</Text>
      <FormTextField
        control={control}
        name="password"
        label={t('profile.deleteAccountPassword')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        {...submitOnDone(onSubmit)}
      />
      <FormMessage message={error} />
      <Button title={t('profile.deleteAccountConfirm')} loading={formState.isSubmitting} onPress={onSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 700 },
  body: { fontSize: 15, lineHeight: 22 },
});
