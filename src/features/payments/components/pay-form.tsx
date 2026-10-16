import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FieldGroup } from '@/components/ui/field-group';
import { FormDateField } from '@/components/ui/form-date-field';
import { FormMessage } from '@/components/ui/form-message';
import { Spacing } from '@/constants/theme';
import { payPaymentSchema, type PayPaymentInput } from '@/core/schemas/planning';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { useWalletOptions } from '@/features/wallets/use-wallet-options';
import type { Wallet } from '@/features/wallets/wallets-api';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { validationMessage } from '@/i18n/messages';

type Props = { wallets: readonly Wallet[]; onSubmit: (values: PayPaymentInput) => Promise<unknown> };

/** Which wallet the payment came out of, and when. Defaults to the default wallet, today. */
export function PayForm({ wallets, onSubmit }: Props) {
  const { t } = useTranslation();
  const { timeZone, locale } = useRegion();
  const today = todayYmd(timeZone);
  const { error, submit } = useFormSubmit(onSubmit);
  const { control, handleSubmit, formState } = useForm<PayPaymentInput>({
    resolver: zodResolver(payPaymentSchema),
    defaultValues: { walletId: wallets.find((w) => w.isDefault)?.id ?? wallets[0]?.id ?? '', date: today },
  });
  const wallet = useController({ control, name: 'walletId' });
  const options = useWalletOptions(wallets);

  return (
    <View style={styles.form}>
      <FieldGroup
        label={t('payments.payFrom')}
        hint={t('payments.payHint')}
        error={validationMessage(t, wallet.fieldState.error?.message)}>
        <ChoiceChips options={options} value={wallet.field.value || null} onChange={wallet.field.onChange} />
      </FieldGroup>
      <FormDateField
        control={control}
        name="date"
        label={t('payments.payDate')}
        initialDate={today}
        maximumDate={today}
        locale={locale}
      />
      <FormMessage message={error} />
      <Button title={t('payments.paySubmit')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
