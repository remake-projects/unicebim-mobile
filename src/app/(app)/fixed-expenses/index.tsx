import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Fab, FAB_CLEARANCE } from '@/components/ui/fab';
import { MenuRow } from '@/components/ui/menu-row';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { roundMoney } from '@/core/number';
import { useFixedExpenses } from '@/features/fixed-expenses/use-fixed-expenses';
import { useFormatMoney } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

export default function FixedExpensesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const expenses = useFixedExpenses();

  if (expenses.isLoadingError) return <ErrorState error={expenses.error} onRetry={() => expenses.refetch()} />;
  if (!expenses.data) return <LoadingState />;
  const total = roundMoney(expenses.data.reduce((sum, e) => sum + e.amount, 0));

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Screen
        edges={UNDER_HEADER_EDGES}
        bottomInset={FAB_CLEARANCE}
        onRefresh={() => expenses.refetch()}
        refreshing={expenses.isRefetching}>
        <Card>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('fixedExpenses.total')}</Text>
          <Text style={[styles.total, { color: theme.text }]}>{format(total)}</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{t('fixedExpenses.hint')}</Text>
        </Card>
        {expenses.data.length === 0 ? (
          <EmptyState
            icon="pin"
            message={t('fixedExpenses.empty')}
            action={{ label: t('fixedExpenses.new'), onPress: () => router.push('/fixed-expenses/new') }}
          />
        ) : (
          <View>
            {expenses.data.map((e) => (
              <MenuRow
                key={e.id}
                title={e.name}
                detail={format(e.amount)}
                onPress={() => router.push({ pathname: '/fixed-expenses/[id]', params: { id: e.id } })}
              />
            ))}
          </View>
        )}
      </Screen>
      <Fab accessibilityLabel={t('fixedExpenses.new')} onPress={() => router.push('/fixed-expenses/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 13, fontWeight: 600 },
  total: { fontSize: 32, fontWeight: 800, fontVariant: ['tabular-nums'] },
  hint: { fontSize: 13, lineHeight: 18 },
});
