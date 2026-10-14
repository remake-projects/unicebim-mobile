import { z } from 'zod';

import { currencyCode, optionalPositiveMoney, optionalYmd, positiveMoney, timeZone, V } from '../validation';

export const FULL_NAME_MIN_LENGTH = 2;
export const FULL_NAME_MAX_LENGTH = 80;

export const fullName = z
  .string({ error: V.required })
  .trim()
  .min(FULL_NAME_MIN_LENGTH, V.tooShort)
  .max(FULL_NAME_MAX_LENGTH, V.tooLong);

export const profileSchema = z.object({
  fullName,
});

/** Budget and planning preferences shown on onboarding and in settings. */
export const budgetSettingsSchema = z.object({
  monthlyBudgetGoal: optionalPositiveMoney,
  nextIncomeDate: optionalYmd,
  mealPrice: optionalPositiveMoney,
});

/** First run: a monthly budget goal is required, the rest can be filled in later. */
export const onboardingSchema = budgetSettingsSchema.extend({
  monthlyBudgetGoal: positiveMoney,
});

export const regionSettingsSchema = z.object({
  currency: currencyCode,
  timeZone,
  locale: z.string().min(2).max(35),
});

export type ProfileFormInput = z.input<typeof profileSchema>;
export type BudgetSettingsFormInput = z.input<typeof budgetSettingsSchema>;
export type BudgetSettingsInput = z.output<typeof budgetSettingsSchema>;
export type OnboardingFormInput = z.input<typeof onboardingSchema>;
export type OnboardingInput = z.output<typeof onboardingSchema>;
export type RegionSettingsInput = z.output<typeof regionSettingsSchema>;
