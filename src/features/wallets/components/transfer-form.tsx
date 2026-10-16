import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FieldGroup } from '@/components/ui/field-group';
import { FormDateField } from '@/components/ui/form-date-field';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Spacing } from '@/constants/theme';
import { transferSchema, type TransferFormInput, type TransferInput } from '@/core/schemas/wallet';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { validationMessage } from '@/i18n/messages';
import { useWalletOptions } from '../use-wallet-options';
import type { Wallet } from '../wallets-api';

type Props = {
  wallets: readonly Wallet[];
  defaultValues: TransferFormInput;
  onSubmit: (values: TransferInput) => Promise<unknown>;
};

export function TransferForm({ wallets, defaultValues, onSubmit }: Props) {
  const { t } = useTranslation();
  const { timeZone, locale } = useRegion();
  const { error, submit } = useFormSubmit(onSubmit);
  const { control, handleSubmit, formState } = useForm<TransferFormInput, unknown, TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues,
  });
  const from = useController({ control, name: 'fromWalletId' });
  const to = useController({ control, name: 'toWalletId' });
  const options = useWalletOptions(wallets);
  const today = todayYmd(timeZone);

  return (
    <View style={styles.form}>
      <FieldGroup label={t('wallets.from')}>
        <ChoiceChips options={options} value={from.field.value || null} onChange={from.field.onChange} />
      </FieldGroup>
      <FieldGroup label={t('wallets.to')} error={validationMessage(t, to.fieldState.error?.message)}>
        <ChoiceChips options={options} value={to.field.value || null} onChange={to.field.onChange} />
      </FieldGroup>
      <FormTextField
        control={control}
        name="amount"
        label={t('transactions.amount')}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder="0"
      />
      <FormDateField
        control={control}
        name="date"
        label={t('transactions.date')}
        initialDate={today}
        maximumDate={today}
        locale={locale}
      />
      <FormMessage message={error} />
      <Button title={t('wallets.transfer')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
