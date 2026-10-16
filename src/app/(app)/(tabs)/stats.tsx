import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { MenuRow } from '@/components/ui/menu-row';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { currentYearMonth, type YearMonth } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { MonthStats } from '@/features/stats/components/month-stats';
import { TrendStats } from '@/features/stats/components/trend-stats';
import { MonthSwitcher } from '@/features/transactions/components/month-switcher';
import { invalidateLedger } from '@/lib/query-keys';

type StatsView = 'month' | 'trend';

export default function StatsScreen() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { timeZone } = useRegion();
  const thisMonth = currentYearMonth(timeZone);
  const [view, setView] = useState<StatsView>('month');
  const [ym, setYm] = useState<YearMonth>(thisMonth);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await invalidateLedger(client);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <SegmentedControl
        options={[
          { value: 'month', label: t('stats.month') },
          { value: 'trend', label: t('stats.trend') },
        ]}
        value={view}
        onChange={setView}
      />
      {view === 'month' ? (
        <>
          <MonthSwitcher value={ym} onChange={setYm} max={thisMonth} />
          <MonthStats ym={ym} />
        </>
      ) : (
        <TrendStats />
      )}
      <View>
        <MenuRow title={t('stats.report')} subtitle={t('stats.reportSubtitle')} onPress={() => router.push('/report')} />
      </View>
    </Screen>
  );
}
