import { z } from 'zod';

import { BILLING_CYCLES } from '../subscriptions';
import { id, positiveMoney, requiredText, V, ymd } from '../validation';

export const PLAN_NAME_MAX_LENGTH = 200;
export const FIXED_EXPENSE_NAME_MAX_LENGTH = 100;

/** Upcoming one-off payment (rent, dorm fee, bill…). Editing may keep a due date that has passed. */
export const paymentSchema = z.object({
  name: requiredText(PLAN_NAME_MAX_LENGTH),
  amount: positiveMoney,
  dueDate: ymd,
});

/** A new payment cannot be due before `today` (the user's current date). */
export const makePaymentSchema = (today: string) =>
  paymentSchema.extend({ dueDate: ymd.refine((d) => d >= today, V.dateInPast) });

/** Recording a payment as paid: which wallet it came out of, and when. */
export const payPaymentSchema = z.object({
  walletId: id,
  date: ymd,
});

/** Amounts are in the user's currency; the logo is derived from the name. */
export const subscriptionSchema = z.object({
  name: requiredText(PLAN_NAME_MAX_LENGTH),
  amount: positiveMoney,
  billingCycle: z.enum(BILLING_CYCLES),
  nextRenewalDate: ymd,
  isActive: z.boolean(),
});

export const fixedExpenseSchema = z.object({
  name: requiredText(FIXED_EXPENSE_NAME_MAX_LENGTH),
  amount: positiveMoney,
});

export type PaymentFormInput = z.input<typeof paymentSchema>;
export type PaymentInput = z.output<typeof paymentSchema>;
export type PayPaymentInput = z.output<typeof payPaymentSchema>;
export type SubscriptionFormInput = z.input<typeof subscriptionSchema>;
export type SubscriptionInput = z.output<typeof subscriptionSchema>;
export type FixedExpenseFormInput = z.input<typeof fixedExpenseSchema>;
export type FixedExpenseInput = z.output<typeof fixedExpenseSchema>;
