import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceChips } from '@/components/ui/choice-chips';
import { Fab } from '@/components/ui/fab';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spacing } from '@/constants/theme';
import { currentYearMonth, type YearMonth } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { MonthSummaryCard } from '@/features/transactions/components/month-summary-card';
import { MonthSwitcher } from '@/features/transactions/components/month-switcher';
import { TransactionList } from '@/features/transactions/components/transaction-list';
import { useMonthSummary } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';

type TypeFilter = 'all' | 'income' | 'expense';
const ALL = 'all';

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { timeZone } = useRegion();
  const thisMonth = currentYearMonth(timeZone);
  const [ym, setYm] = useState<YearMonth>(thisMonth);
  const [type, setType] = useState<TypeFilter>(ALL);
  const [walletId, setWalletId] = useState<string>(ALL);
  const { data: wallets } = useWallets();
  const wallet = walletId === ALL ? null : walletId;
  const summary = useMonthSummary(ym, wallet);

  const walletOptions = [
    { value: ALL, label: t('transactions.allWallets') },
    ...(wallets ?? []).map((w) => ({ value: w.id, label: w.name })),
  ];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <TransactionList
        filters={{ ym, type: type === ALL ? null : type, walletId: wallet }}
        header={
          <View style={styles.header}>
            <MonthSwitcher value={ym} onChange={setYm} max={thisMonth} />
            <MonthSummaryCard summary={summary.data} />
            <SegmentedControl<TypeFilter>
              options={[
                { value: ALL, label: t('common.all') },
                { value: 'expense', label: t('transactions.type.expense') },
                { value: 'income', label: t('transactions.type.income') },
              ]}
              value={type}
              onChange={setType}
            />
            {(wallets?.length ?? 0) > 1 ? (
              <ChoiceChips options={walletOptions} value={walletId} onChange={setWalletId} />
            ) : null}
          </View>
        }
      />
      <Fab accessibilityLabel={t('transactions.add')} onPress={() => router.push('/transaction/new')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: Spacing.three },
});
