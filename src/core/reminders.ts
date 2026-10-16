import { nextRenewalOnOrAfter, type BillingCycle } from './subscriptions';
import { addDays, zonedWallClockToInstant, type Ymd } from './time';

export type ReminderKind = 'paymentDueTomorrow' | 'paymentDueToday' | 'renewalTomorrow' | 'incomeToday';

export type Reminder = {
  /** Stable per item and kind, e.g. "paymentDueToday:<payment id>". */
  id: string;
  kind: ReminderKind;
  at: Date;
  name?: string;
  amount?: number;
};

export type ReminderInput = {
  now: Date;
  today: Ymd;
  timeZone: string;
  payments: readonly { id: string; name: string; amount: number; dueDate: Ymd; isPaid: boolean }[];
  subscriptions: readonly {
    id: string;
    name: string;
    amount: number;
    billingCycle: BillingCycle;
    nextRenewalDate: Ymd;
    isActive: boolean;
  }[];
  nextIncomeDate: Ymd | null;
};

/** Local time reminders go off. */
export const REMINDER_HOUR = 9;
/** Only the near future is scheduled; the plan is rebuilt whenever the app opens or data changes. */
const HORIZON_DAYS = 45;
/** iOS keeps at most 64 pending local notifications per app. */
export const MAX_REMINDERS = 50;

/**
 * Reminders to schedule: a day before and on a payment's due date, a day before a subscription
 * renews, and on the income day — at REMINDER_HOUR in the user's time zone, soonest first.
 */
export function planReminders({ now, today, timeZone, payments, subscriptions, nextIncomeDate }: ReminderInput): Reminder[] {
  const at = (ymd: Ymd) => {
    const [year, month, day] = ymd.split('-').map(Number) as [number, number, number];
    return zonedWallClockToInstant({ year, month, day, hour: REMINDER_HOUR, minute: 0, second: 0 }, timeZone);
  };
  const latest = addDays(today, HORIZON_DAYS);
  const reminders: Reminder[] = [];
  const add = (kind: ReminderKind, key: string, ymd: Ymd, extra: Pick<Reminder, 'name' | 'amount'> = {}) => {
    if (ymd < today || ymd > latest) return;
    const when = at(ymd);
    if (when > now) reminders.push({ id: `${kind}:${key}`, kind, at: when, ...extra });
  };

  for (const p of payments) {
    if (p.isPaid) continue;
    add('paymentDueTomorrow', p.id, addDays(p.dueDate, -1), { name: p.name, amount: p.amount });
    add('paymentDueToday', p.id, p.dueDate, { name: p.name, amount: p.amount });
  }
  for (const s of subscriptions) {
    if (!s.isActive) continue;
    const renewal = nextRenewalOnOrAfter(s.nextRenewalDate, s.billingCycle, today);
    add('renewalTomorrow', s.id, addDays(renewal, -1), { name: s.name, amount: s.amount });
  }
  if (nextIncomeDate) add('incomeToday', 'income', nextIncomeDate);

  return reminders.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_REMINDERS);
}
