import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormDateField } from '@/components/ui/form-date-field';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Spacing } from '@/constants/theme';
import { onboardingSchema, type OnboardingFormInput, type OnboardingInput } from '@/core/schemas/profile';
import { todayYmd } from '@/core/time';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';
import { useUpdateBudgetSettings } from '../use-profile';
import { useRegion } from '../use-region';

/** First run on the home screen: the budget goal unlocks the dashboard. */
export function OnboardingForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { timeZone, locale, currency } = useRegion();
  const update = useUpdateBudgetSettings();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<OnboardingFormInput, unknown, OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { monthlyBudgetGoal: '', nextIncomeDate: '', mealPrice: '' },
  });
  const today = todayYmd(timeZone);
  const optional = ` (${t('common.optional')})`;

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await update.mutateAsync(values); // the profile cache update swaps in the dashboard
    } catch (error) {
      setServerError(errorMessage(t, error));
    }
  });

  return (
    <View style={styles.form}>
      <Text style={[styles.title, { color: theme.text }]}>{t('onboarding.title')}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('onboarding.subtitle')}</Text>
      <FormTextField
        control={control}
        name="monthlyBudgetGoal"
        label={`${t('onboarding.budgetGoal')} (${currency})`}
        keyboardType="decimal-pad"
        inputMode="decimal"
      />
      <FormDateField
        control={control}
        name="nextIncomeDate"
        label={t('onboarding.nextIncomeDate') + optional}
        initialDate={today}
        minimumDate={today}
        locale={locale}
        optional
      />
      <FormTextField
        control={control}
        name="mealPrice"
        label={`${t('onboarding.mealPrice')} (${currency})${optional}`}
        keyboardType="decimal-pad"
        inputMode="decimal"
      />
      <FormMessage message={serverError} />
      <Button title={t('onboarding.submit')} loading={formState.isSubmitting} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  title: { fontSize: 28, fontWeight: 800 },
  subtitle: { fontSize: 15, lineHeight: 22 },
});
