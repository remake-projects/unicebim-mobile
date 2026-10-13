import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/coming-soon';

export default function StatsScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.stats')} />;
}
