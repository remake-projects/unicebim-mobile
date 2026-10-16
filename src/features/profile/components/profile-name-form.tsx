import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Spacing } from '@/constants/theme';
import { FULL_NAME_MAX_LENGTH, profileSchema, type ProfileFormInput } from '@/core/schemas/profile';
import { useFormSubmit } from '@/hooks/use-form-submit';

type Props = { fullName: string; onSubmit: (fullName: string) => Promise<unknown> };

export function ProfileNameForm({ fullName, onSubmit }: Props) {
  const { t } = useTranslation();
  const { error, submit } = useFormSubmit((values: ProfileFormInput) => onSubmit(values.fullName));
  const { control, handleSubmit, formState } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName },
  });

  return (
    <View style={styles.form}>
      <FormTextField
        control={control}
        name="fullName"
        label={t('auth.fullName')}
        autoComplete="name"
        textContentType="name"
        maxLength={FULL_NAME_MAX_LENGTH}
      />
      <FormMessage message={error} />
      <Button title={t('common.save')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
