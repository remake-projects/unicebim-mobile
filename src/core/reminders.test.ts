import { describe, expect, it } from 'vitest';

import { MAX_REMINDERS, planReminders } from './reminders';

const base = {
  now: new Date('2026-10-16T05:00:00Z'), // 08:00 in Istanbul
  today: '2026-10-16',
  timeZone: 'Europe/Istanbul',
  payments: [],
  subscriptions: [],
  nextIncomeDate: null,
};

describe('planReminders', () => {
  it('reminds a day before and on the due date at 09:00 local time', () => {
    const r = planReminders({
      ...base,
      payments: [{ id: 'p1', name: 'Rent', amount: 500, dueDate: '2026-10-20', isPaid: false }],
    });
    expect(r.map((x) => [x.id, x.at.toISOString()])).toEqual([
      ['paymentDueTomorrow:p1', '2026-10-19T06:00:00.000Z'],
      ['paymentDueToday:p1', '2026-10-20T06:00:00.000Z'],
    ]);
    expect(r[0]).toMatchObject({ name: 'Rent', amount: 500 });
  });

  it('skips paid payments and times that have passed', () => {
    const r = planReminders({
      ...base,
      now: new Date('2026-10-16T07:00:00Z'), // 10:00 local, today's 09:00 is gone
      payments: [
        { id: 'p1', name: 'Today', amount: 1, dueDate: '2026-10-16', isPaid: false },
        { id: 'p2', name: 'Tomorrow', amount: 1, dueDate: '2026-10-17', isPaid: false },
        { id: 'p3', name: 'Paid', amount: 1, dueDate: '2026-10-18', isPaid: true },
      ],
    });
    expect(r.map((x) => x.id)).toEqual(['paymentDueToday:p2']);
  });

  it('reminds before the next renewal, rolling passed dates forward', () => {
    const r = planReminders({
      ...base,
      subscriptions: [
        { id: 's1', name: 'Music', amount: 60, billingCycle: 'monthly', nextRenewalDate: '2026-09-25', isActive: true },
        { id: 's2', name: 'Paused', amount: 60, billingCycle: 'monthly', nextRenewalDate: '2026-10-20', isActive: false },
      ],
      nextIncomeDate: '2026-10-17',
    });
    expect(r.map((x) => [x.id, x.at.toISOString()])).toEqual([
      ['incomeToday:income', '2026-10-17T06:00:00.000Z'],
      ['renewalTomorrow:s1', '2026-10-24T06:00:00.000Z'],
    ]);
  });

  it('ignores the far future and caps the count', () => {
    const payments = Array.from({ length: 40 }, (_, i) => ({
      id: `p${i}`,
      name: 'x',
      amount: 1,
      dueDate: i === 0 ? '2027-06-01' : '2026-10-20',
      isPaid: false,
    }));
    const r = planReminders({ ...base, payments });
    expect(r).toHaveLength(MAX_REMINDERS);
    expect(r.some((x) => x.id.endsWith(':p0'))).toBe(false);
  });
});
