import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/coming-soon';

export default function TransactionsScreen() {
  const { t } = useTranslation();
  return <ComingSoon title={t('tabs.transactions')} />;
}
