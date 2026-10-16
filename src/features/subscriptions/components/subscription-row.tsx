import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MenuRow } from '@/components/ui/menu-row';
import { daysUntilRenewal } from '@/core/subscriptions';
import type { Ymd } from '@/core/time';
import { useFormatMoney } from '@/features/profile/use-region';
import type { Subscription } from '../subscriptions-api';
import { BrandLogo } from './brand-logo';

export function SubscriptionRow({ subscription: s, today }: { subscription: Subscription; today: Ymd }) {
  const { t } = useTranslation();
  const format = useFormatMoney();
  const days = daysUntilRenewal(s.nextRenewalDate, s.billingCycle, today);
  const renews = days === 0 ? t('subscriptions.renewsToday') : t('subscriptions.renewsIn', { count: days });
  const subtitle = s.isActive ? `${t(`subscriptions.cycle.${s.billingCycle}`)} · ${renews}` : t('subscriptions.paused');

  return (
    <MenuRow
      leading={<BrandLogo name={s.name} uri={s.iconUrl} />}
      title={s.name}
      subtitle={subtitle}
      subtitleTone={s.isActive && days <= 3 ? 'warning' : 'default'}
      detail={format(s.amount)}
      onPress={() => router.push({ pathname: '/subscriptions/[id]', params: { id: s.id } })}
    />
  );
}
