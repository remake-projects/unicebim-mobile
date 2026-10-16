import type { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormDateField } from '@/components/ui/form-date-field';
import { FormTextField } from '@/components/ui/form-text-field';
import type { OnboardingFormInput } from '@/core/schemas/profile';
import { todayYmd } from '@/core/time';
import { useRegion } from '../use-region';

/**
 * Monthly goal, next income day and meal price — shared by onboarding and budget settings.
 * The goal is always required: the home screen falls back to onboarding without it.
 */
export function BudgetSettingsFields({ control }: { control: Control<OnboardingFormInput> }) {
  const { t } = useTranslation();
  const { timeZone, locale, currency } = useRegion();
  const today = todayYmd(timeZone);
  const optional = ` (${t('common.optional')})`;

  return (
    <>
      <FormTextField
        control={control}
        name="monthlyBudgetGoal"
        label={`${t('budget.goal')} (${currency})`}
        keyboardType="decimal-pad"
        inputMode="decimal"
      />
      <FormDateField
        control={control}
        name="nextIncomeDate"
        label={t('budget.nextIncomeDate') + optional}
        initialDate={today}
        minimumDate={today}
        locale={locale}
        optional
      />
      <FormTextField
        control={control}
        name="mealPrice"
        label={`${t('budget.mealPrice')} (${currency})${optional}`}
        keyboardType="decimal-pad"
        inputMode="decimal"
      />
    </>
  );
}
