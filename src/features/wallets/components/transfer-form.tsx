import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FormDateField } from '@/components/ui/form-date-field';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Spacing } from '@/constants/theme';
import { transferSchema, type TransferFormInput, type TransferInput } from '@/core/schemas/wallet';
import { todayYmd } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage, validationMessage } from '@/i18n/messages';
import type { Wallet } from '../wallets-api';

type Props = {
  wallets: readonly Wallet[];
  defaultValues: TransferFormInput;
  onSubmit: (values: TransferInput) => Promise<unknown>;
};

export function TransferForm({ wallets, defaultValues, onSubmit }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { timeZone, locale } = useRegion();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<TransferFormInput, unknown, TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues,
  });
  const from = useController({ control, name: 'fromWalletId' });
  const to = useController({ control, name: 'toWalletId' });
  const options = wallets.map((w) => ({ value: w.id, label: `${w.name} · ${format(w.balance)}` }));
  const today = todayYmd(timeZone);

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
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.text }]}>{t('wallets.from')}</Text>
        <ChoiceChips options={options} value={from.field.value || null} onChange={from.field.onChange} />
      </View>
      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.text }]}>{t('wallets.to')}</Text>
        <ChoiceChips options={options} value={to.field.value || null} onChange={to.field.onChange} />
        {to.fieldState.error ? (
          <Text style={[styles.error, { color: theme.danger }]}>
            {validationMessage(t, to.fieldState.error.message)}
          </Text>
        ) : null}
      </View>
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
      <FormMessage message={serverError} />
      <Button title={t('wallets.transfer')} loading={formState.isSubmitting} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  group: { gap: Spacing.two },
  label: { fontSize: 14, fontWeight: 600 },
  error: { fontSize: 13 },
});
