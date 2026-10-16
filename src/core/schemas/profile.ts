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

/** BCP 47 tag as the database accepts it (profiles_locale_format), e.g. "tr" or "en-GB". */
const localeTag = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, V.required);

/** Currency, time zone and language; amounts are not converted when the currency changes. */
export const regionSettingsSchema = z.object({
  currency: currencyCode,
  timeZone,
  locale: localeTag,
});

export type ProfileFormInput = z.input<typeof profileSchema>;
export type BudgetSettingsFormInput = z.input<typeof budgetSettingsSchema>;
export type BudgetSettingsInput = z.output<typeof budgetSettingsSchema>;
export type OnboardingFormInput = z.input<typeof onboardingSchema>;
export type OnboardingInput = z.output<typeof onboardingSchema>;
export type RegionSettingsInput = z.output<typeof regionSettingsSchema>;
