import { z } from 'zod';

import { currencyCode, id, positiveMoney, requiredText, V, ymd } from '../validation';

export const PLAN_NAME_MAX_LENGTH = 200;
export const FIXED_EXPENSE_NAME_MAX_LENGTH = 100;

/** Upcoming one-off payment (rent, dorm fee, bill…). `today` is the user's current date. */
export const makePaymentSchema = (today: string) =>
  z.object({
    name: requiredText(PLAN_NAME_MAX_LENGTH),
    amount: positiveMoney,
    dueDate: ymd.refine((d) => d >= today, V.dateInPast),
  });

export const updatePaymentSchema = z.object({
  id,
  name: requiredText(PLAN_NAME_MAX_LENGTH),
  amount: positiveMoney,
  dueDate: ymd,
});

export const subscriptionSchema = z.object({
  name: requiredText(PLAN_NAME_MAX_LENGTH),
  amount: positiveMoney,
  currency: currencyCode,
  billingCycle: z.enum(['monthly', 'yearly']),
  nextRenewalDate: ymd,
  iconUrl: z.url({ error: V.invalidUrl }).nullish().transform((v) => v ?? null),
  isActive: z.boolean().default(true),
});

export const fixedExpenseSchema = z.object({
  name: requiredText(FIXED_EXPENSE_NAME_MAX_LENGTH),
  amount: positiveMoney,
});

export type PaymentFormInput = z.input<ReturnType<typeof makePaymentSchema>>;
export type PaymentInput = z.output<ReturnType<typeof makePaymentSchema>>;
export type SubscriptionFormInput = z.input<typeof subscriptionSchema>;
export type SubscriptionInput = z.output<typeof subscriptionSchema>;
export type FixedExpenseFormInput = z.input<typeof fixedExpenseSchema>;
export type FixedExpenseInput = z.output<typeof fixedExpenseSchema>;
