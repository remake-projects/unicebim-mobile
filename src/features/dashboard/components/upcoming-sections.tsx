import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SectionHeader } from '@/components/ui/section-header';
import { daysUntilRenewal } from '@/core/subscriptions';
import { todayYmd } from '@/core/time';
import { PaymentRow } from '@/features/payments/components/payment-row';
import { usePaymentAnalyses, usePayments } from '@/features/payments/use-payments';
import { useRegion } from '@/features/profile/use-region';
import { SubscriptionRow } from '@/features/subscriptions/components/subscription-row';
import { useSubscriptions } from '@/features/subscriptions/use-subscriptions';

const MAX_PAYMENTS = 3;
const RENEWAL_WINDOW_DAYS = 7;

/** The next few unpaid payments with their coverage warnings; nothing when there are none. */
export function UpcomingPayments() {
  const { t } = useTranslation();
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const payments = usePayments();
  const analyses = usePaymentAnalyses();
  const upcoming = payments.data?.filter((p) => !p.isPaid).slice(0, MAX_PAYMENTS) ?? [];
  if (!upcoming.length) return null;

  return (
    <>
      <SectionHeader title={t('payments.upcoming')} actionLabel={t('common.seeAll')} onAction={() => router.push('/payments')} />
      <View>
        {upcoming.map((p) => (
          <PaymentRow key={p.id} payment={p} analysis={analyses?.get(p.id)} today={today} />
        ))}
      </View>
    </>
  );
}

/** Active subscriptions renewing within a week; nothing when there are none. */
export function RenewingSubscriptions() {
  const { t } = useTranslation();
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const subscriptions = useSubscriptions();
  const renewing = (subscriptions.data ?? [])
    .filter((s) => s.isActive)
    .map((s) => ({ s, days: daysUntilRenewal(s.nextRenewalDate, s.billingCycle, today) }))
    .filter(({ days }) => days <= RENEWAL_WINDOW_DAYS)
    .sort((a, b) => a.days - b.days);
  if (!renewing.length) return null;

  return (
    <>
      <SectionHeader
        title={t('subscriptions.upcoming')}
        actionLabel={t('common.seeAll')}
        onAction={() => router.push('/subscriptions')}
      />
      <View>
        {renewing.map(({ s }) => (
          <SubscriptionRow key={s.id} subscription={s} today={today} />
        ))}
      </View>
    </>
  );
}
