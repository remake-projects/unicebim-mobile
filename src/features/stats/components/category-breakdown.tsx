import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { ShareList } from '@/components/charts/share-list';
import { getExpenseBreakdown, type CategoryAmount } from '@/core/insights';
import { useFormatMoney } from '@/features/profile/use-region';
import { categoryEmoji } from '@/features/transactions/category-meta';
import { useCategoryLabel } from '@/features/transactions/use-category-label';
import { useTheme } from '@/hooks/use-theme';

export function CategoryBreakdown({ totals }: { totals: readonly CategoryAmount[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const label = useCategoryLabel();
  const { slices } = getExpenseBreakdown(totals);
  if (!slices.length) return <Text style={{ color: theme.textSecondary }}>{t('stats.categoriesEmpty')}</Text>;
  return (
    <ShareList
      items={slices.map((s) => ({
        key: s.category,
        label: label(s.category),
        leading: <Text>{categoryEmoji(s.category)}</Text>,
        value: format(s.amount),
        ratio: s.percent,
      }))}
    />
  );
}
