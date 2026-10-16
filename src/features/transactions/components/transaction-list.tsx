import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { FAB_CLEARANCE } from '@/components/ui/fab';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { addDays, formatYmd, todayYmd, type Ymd } from '@/core/time';
import { dayNet, groupByDay } from '@/core/transaction-groups';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useWallets } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';
import { invalidateLedger, type TransactionListFilters } from '@/lib/query-keys';
import type { Transaction } from '../transactions-api';
import { useTransactionList } from '../use-transactions';
import { TransactionRow } from './transaction-row';

type Props = {
  filters: TransactionListFilters;
  /** Rendered above the list (month switcher, filters, summary…). */
  header: ReactElement;
};

export function openTransaction(tx: Pick<Transaction, 'id'>) {
  router.push({ pathname: '/transaction/[id]', params: { id: tx.id } });
}

function useDayLabel(): (date: Ymd) => string {
  const { t } = useTranslation();
  const { timeZone, locale } = useRegion();
  const today = todayYmd(timeZone);
  return (date) => {
    if (date === today) return t('transactions.today');
    if (date === addDays(today, -1)) return t('transactions.yesterday');
    return formatYmd(date, locale, { weekday: 'long', day: 'numeric', month: 'long' });
  };
}

/** Infinite, day-grouped transaction list for one month with pull to refresh. */
export function TransactionList({ filters, header }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const client = useQueryClient();
  const { timeZone } = useRegion();
  const dayLabel = useDayLabel();
  const format = useFormatMoney();
  const list = useTransactionList(filters);
  const { data: wallets } = useWallets();
  const [refreshing, setRefreshing] = useState(false);

  const walletNames = new Map(wallets?.map((w) => [w.id, w.name]));
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const groups = groupByDay(items, timeZone);
  const sections = groups.map((g, i) => ({
    title: g.date,
    // The last loaded day may continue on the next page, so its total would be partial.
    net: i === groups.length - 1 && list.hasNextPage ? null : dayNet(g.items),
    data: g.items,
  }));

  async function onRefresh() {
    setRefreshing(true);
    try {
      await invalidateLedger(client);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={<View style={styles.header}>{header}</View>}
      renderSectionHeader={({ section }) => (
        <View style={styles.dayRow}>
          <Text style={[styles.day, { color: theme.textSecondary }]}>{dayLabel(section.title)}</Text>
          {section.net ? (
            <Text style={[styles.dayNet, { color: theme.textSecondary }]}>
              {`${section.net > 0 ? '+' : '−'}${format(Math.abs(section.net))}`}
            </Text>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => (
        <TransactionRow
          transaction={item}
          walletName={item.walletId ? (walletNames.get(item.walletId) ?? null) : null}
          onPress={openTransaction}
        />
      )}
      ListEmptyComponent={
        list.isPending ? (
          <ActivityIndicator style={styles.loading} color={theme.textSecondary} />
        ) : list.isLoadingError ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : (
          <EmptyState icon="receipt" message={t('transactions.empty')} />
        )
      }
      ListFooterComponent={
        list.isFetchingNextPage ? <ActivityIndicator style={styles.loading} color={theme.textSecondary} /> : null
      }
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
      }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: FAB_CLEARANCE,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { gap: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  // No textTransform: 'uppercase' — it ignores the locale and turns Turkish "i" into "I".
  dayRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: Spacing.three },
  day: { fontSize: 14, fontWeight: 700 },
  dayNet: { fontSize: 13, fontWeight: 600, fontVariant: ['tabular-nums'] },
  loading: { marginVertical: Spacing.four },
});
