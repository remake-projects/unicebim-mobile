import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Spacing } from '@/constants/theme';
import { WALLET_NAME_MAX_LENGTH, walletSchema, type WalletFormInput, type WalletInput } from '@/core/schemas/wallet';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';

type Props = {
  defaultValues: WalletFormInput;
  /** New wallets can become the default right away; existing ones use "make default". */
  showDefaultToggle: boolean;
  submitLabel: string;
  onSubmit: (values: WalletInput) => Promise<unknown>;
};

export function WalletForm({ defaultValues, showDefaultToggle, submitLabel, onSubmit }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<WalletFormInput, unknown, WalletInput>({
    resolver: zodResolver(walletSchema),
    defaultValues,
  });
  const isDefault = useController({ control, name: 'isDefault' });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(errorMessage(t, error));
    }
  });

  return (
    <View style={styles.form}>
      <FormTextField control={control} name="name" label={t('wallets.name')} maxLength={WALLET_NAME_MAX_LENGTH} />
      <View style={styles.group}>
        <FormTextField
          control={control}
          name="balance"
          label={t('wallets.openingBalance')}
          keyboardType="decimal-pad"
          inputMode="decimal"
          placeholder="0"
        />
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{t('wallets.balanceHint')}</Text>
      </View>
      {showDefaultToggle ? (
        <Checkbox label={t('wallets.makeDefault')} checked={!!isDefault.field.value} onChange={isDefault.field.onChange} />
      ) : null}
      <FormMessage message={serverError} />
      <Button title={submitLabel} loading={formState.isSubmitting} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  group: { gap: Spacing.one },
  hint: { fontSize: 13 },
});
