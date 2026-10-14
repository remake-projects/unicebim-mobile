import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { currentYearMonth, type YearMonth } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { MonthSummaryCard } from '@/features/transactions/components/month-summary-card';
import { MonthSwitcher } from '@/features/transactions/components/month-switcher';
import { TransactionList } from '@/features/transactions/components/transaction-list';
import { useMonthSummary } from '@/features/transactions/use-transactions';
import { useSetDefaultWallet, useWallet } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';
import { AppError } from '@/lib/app-error';

export default function WalletDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timeZone } = useRegion();
  const thisMonth = currentYearMonth(timeZone);
  const [ym, setYm] = useState<YearMonth>(thisMonth);
  const wallet = useWallet(id);
  const summary = useMonthSummary(ym, id);
  const setDefault = useSetDefaultWallet();

  if (wallet.isError) return <ErrorState error={wallet.error} onRetry={() => wallet.refetch()} />;
  if (wallet.isPending) return <LoadingState />;
  if (!wallet.data) return <ErrorState error={new AppError('notFound')} />;
  const w = wallet.data;

  async function makeDefault() {
    try {
      await setDefault.mutateAsync(w.id);
    } catch (error) {
      Alert.alert(errorMessage(t, error));
    }
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={UNDER_HEADER_EDGES}>
      <Stack.Screen options={{ title: w.name }} />
      <TransactionList
        filters={{ ym, type: null, walletId: w.id }}
        header={
          <View style={styles.header}>
            <Card>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {t('wallets.balance')}
                {w.isDefault ? ` · ${t('wallets.isDefault')}` : ''}
              </Text>
              <Text style={[styles.balance, { color: theme.text }]}>{format(w.balance)}</Text>
            </Card>
            <View style={styles.actions}>
              <Button
                variant="secondary"
                title={t('wallets.edit')}
                style={styles.action}
                onPress={() => router.push({ pathname: '/wallets/edit/[id]', params: { id: w.id } })}
              />
              <Button
                variant="secondary"
                title={t('wallets.transfer')}
                style={styles.action}
                onPress={() => router.push({ pathname: '/wallets/transfer', params: { from: w.id } })}
              />
            </View>
            {!w.isDefault ? (
              <Button variant="ghost" title={t('wallets.makeDefault')} loading={setDefault.isPending} onPress={makeDefault} />
            ) : null}
            <MonthSwitcher value={ym} onChange={setYm} max={thisMonth} />
            <MonthSummaryCard summary={summary.data} />
          </View>
        }
      />
      <Fab
        accessibilityLabel={t('transactions.add')}
        onPress={() => router.push({ pathname: '/transaction/new', params: { walletId: w.id } })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: Spacing.three },
  label: { fontSize: 13, fontWeight: 600 },
  balance: { fontSize: 32, fontWeight: 800, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: Spacing.two },
  action: { flex: 1 },
});
