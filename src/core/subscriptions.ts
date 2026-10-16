import { roundMoney } from './number';
import { addMonthsToYmd, type Ymd } from './time';

export const BILLING_CYCLES = ['monthly', 'yearly'] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

const CYCLE_MONTHS: Record<BillingCycle, number> = { monthly: 1, yearly: 12 };

/**
 * The first renewal on or after `today`. A stored date that has passed is rolled forward by whole
 * cycles, always counted from the stored date so a 31st keeps renewing on month ends.
 */
export function nextRenewalOnOrAfter(date: Ymd, cycle: BillingCycle, today: Ymd): Ymd {
  const step = CYCLE_MONTHS[cycle];
  let next = date;
  for (let i = 1; next < today; i++) next = addMonthsToYmd(date, i * step);
  return next;
}

/** The renewal after `date` (default for a new subscription that started on `date`). */
export function renewalAfter(date: Ymd, cycle: BillingCycle): Ymd {
  return addMonthsToYmd(date, CYCLE_MONTHS[cycle]);
}

export function monthlyCost(amount: number, cycle: BillingCycle): number {
  return amount / CYCLE_MONTHS[cycle];
}

/** What the active subscriptions cost per month, yearly ones spread over 12 months. */
export function monthlySubscriptionsTotal(
  subscriptions: readonly { amount: number; billingCycle: BillingCycle; isActive: boolean }[]
): number {
  return roundMoney(
    subscriptions.filter((s) => s.isActive).reduce((sum, s) => sum + monthlyCost(s.amount, s.billingCycle), 0)
  );
}
