import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { MenuRow } from '@/components/ui/menu-row';
import type { PaymentAnalysis, WarningLevel } from '@/core/payment-analysis';
import { daysBetween, formatYmd, ymdInZone, type Ymd } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import type { Payment } from '../payments-api';

type Props = { payment: Payment; analysis: PaymentAnalysis | undefined; today: Ymd };

const LEVEL_TONE: Record<WarningLevel, 'default' | 'warning' | 'danger'> = {
  none: 'default',
  low: 'warning',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

function dueLabel(t: TFunction, dueDate: Ymd, today: Ymd): string {
  const days = daysBetween(today, dueDate);
  if (days === 0) return t('payments.dueToday');
  return days > 0 ? t('payments.dueIn', { count: days }) : t('payments.overdue', { count: -days });
}

/** A payment with its due date (or paid date) and, when unpaid, whether it can be covered. */
export function PaymentRow({ payment, analysis, today }: Props) {
  const { t } = useTranslation();
  const format = useFormatMoney();
  const { timeZone, locale } = useRegion();

  let subtitle: string;
  let tone: 'default' | 'warning' | 'danger' | 'success' = 'default';
  if (payment.isPaid) {
    const paidOn = payment.paidAt ? ymdInZone(payment.paidAt, timeZone) : payment.dueDate;
    subtitle = t('payments.paidOn', { date: formatYmd(paidOn, locale) });
    tone = 'success';
  } else {
    const parts = [formatYmd(payment.dueDate, locale), dueLabel(t, payment.dueDate, today)];
    if (analysis?.reason) parts.push(t(`payments.warning.${analysis.reason}`));
    subtitle = parts.join(' · ');
    tone = payment.dueDate < today ? 'danger' : analysis ? LEVEL_TONE[analysis.level] : 'default';
  }

  return (
    <MenuRow
      title={payment.name}
      subtitle={subtitle}
      subtitleTone={tone}
      detail={format(payment.amount)}
      onPress={() => router.push({ pathname: '/payments/[id]', params: { id: payment.id } })}
    />
  );
}
