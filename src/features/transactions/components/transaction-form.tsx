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
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spacing } from '@/constants/theme';
import { isCategoryForType, type TransactionType } from '@/core/categories';
import {
  transactionSchema,
  type TransactionFormInput,
  type TransactionInput,
} from '@/core/schemas/transaction';
import { DESCRIPTION_MAX_LENGTH } from '@/core/validation';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { useWalletOptions } from '@/features/wallets/use-wallet-options';
import type { Wallet } from '@/features/wallets/wallets-api';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { validationMessage } from '@/i18n/messages';
import { CategoryPicker } from './category-picker';

const NO_WALLET = 'none';

type Props = {
  defaultValues: TransactionFormInput;
  wallets: readonly Wallet[];
  submitLabel: string;
  onSubmit: (values: TransactionInput) => Promise<unknown>;
};

/** Add / edit form: type, amount, category, wallet, date and note. */
export function TransactionForm({ defaultValues, wallets, submitLabel, onSubmit }: Props) {
  const { t } = useTranslation();
  const { timeZone, locale } = useRegion();
  const { error, submit } = useFormSubmit(onSubmit);
  const { control, handleSubmit, formState, setValue } = useForm<TransactionFormInput, unknown, TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });
  const type = useController({ control, name: 'type' });
  const category = useController({ control, name: 'category' });
  const wallet = useController({ control, name: 'walletId' });
  const today = todayYmd(timeZone);

  function changeType(next: TransactionType) {
    type.field.onChange(next);
    // Categories differ per type; keep the choice only when it still fits.
    if (!isCategoryForType(next, category.field.value)) setValue('category', '');
  }

  const baseWalletOptions = useWalletOptions(wallets);
  const walletOptions = [
    ...baseWalletOptions,
    // Only offered when editing an entry that has no wallet.
    ...(wallet.field.value ? [] : [{ value: NO_WALLET, label: t('transactions.noWallet') }]),
  ];

  return (
    <View style={styles.form}>
      <SegmentedControl
        options={[
          { value: 'expense', label: t('transactions.type.expense') },
          { value: 'income', label: t('transactions.type.income') },
        ]}
        value={type.field.value}
        onChange={changeType}
      />
      <FormTextField
        control={control}
        name="amount"
        label={t('transactions.amount')}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder="0"
        style={styles.amount}
      />

      <FieldGroup label={t('transactions.category')}>
        <CategoryPicker
          type={type.field.value}
          value={category.field.value}
          onChange={category.field.onChange}
          error={validationMessage(t, category.fieldState.error?.message)}
        />
      </FieldGroup>

      <FieldGroup label={t('transactions.wallet')}>
        <ChoiceChips
          options={walletOptions}
          value={wallet.field.value ?? NO_WALLET}
          onChange={(id) => wallet.field.onChange(id === NO_WALLET ? null : id)}
        />
      </FieldGroup>

      <FormDateField
        control={control}
        name="date"
        label={t('transactions.date')}
        initialDate={today}
        maximumDate={today}
        locale={locale}
      />
      <FormTextField
        control={control}
        name="description"
        label={t('transactions.description')}
        placeholder={t('transactions.descriptionPlaceholder')}
        maxLength={DESCRIPTION_MAX_LENGTH}
        multiline
      />

      <FormMessage message={error} />
      <Button title={submitLabel} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  amount: { fontSize: 28, fontWeight: 700, minHeight: 64 },
});
