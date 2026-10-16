import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { planReminders } from '@/core/reminders';
import { todayYmd } from '@/core/time';
import { usePayments } from '@/features/payments/use-payments';
import { useProfile } from '@/features/profile/use-profile';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useSubscriptions } from '@/features/subscriptions/use-subscriptions';
import { useDeviceSettings } from '@/lib/device-settings';
import { cancelReminders, replaceReminders, type ScheduledReminder } from './notifications';

/**
 * Keeps the scheduled local notifications in line with payments, subscriptions and the income
 * day while reminders are on. Mounted once for the signed-in app.
 */
export function useReminderSync(): void {
  const { t } = useTranslation();
  const { reminders: enabled, appLock } = useDeviceSettings();
  const { timeZone } = useRegion();
  const format = useFormatMoney();
  const payments = usePayments();
  const subscriptions = useSubscriptions();
  const profile = useProfile();

  const ready = enabled && payments.data && subscriptions.data && profile.data;
  const scheduled: ScheduledReminder[] = ready
    ? planReminders({
        now: new Date(),
        today: todayYmd(timeZone),
        timeZone,
        payments: payments.data!,
        subscriptions: subscriptions.data!,
        nextIncomeDate: profile.data!.nextIncomeDate,
      }).map((r) => ({
        id: r.id,
        at: r.at,
        title: t(`reminders.${r.kind}`),
        // Notifications show on the lock screen; with the app lock on, names and amounts stay inside.
        body:
          r.kind === 'incomeToday'
            ? t('reminders.incomeBody')
            : appLock
              ? t('reminders.privateBody')
              : t('reminders.itemBody', { name: r.name, amount: format(r.amount ?? 0) }),
      }))
    : [];
  // Rescheduling only when the plan itself changes, not on every render.
  const signature = ready ? JSON.stringify(scheduled.map((r) => [r.id, r.at.getTime(), r.title, r.body])) : null;

  useEffect(() => {
    if (!enabled) {
      cancelReminders().catch(() => {});
      return;
    }
    if (signature == null) return;
    replaceReminders(JSON.parse(signature).map(([id, at, title, body]: [string, number, string, string]) => ({
      id,
      at: new Date(at),
      title,
      body,
    }))).catch(() => {});
  }, [enabled, signature]);
}
