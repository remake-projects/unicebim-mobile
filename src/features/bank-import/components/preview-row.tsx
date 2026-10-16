import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import type { ImportPreviewRow } from '@/core/bank-import/types';
import { formatYmd, ymdInZone } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { categoryEmoji } from '@/features/transactions/category-meta';
import { AmountText } from '@/features/transactions/components/amount-text';
import { useCategoryLabel } from '@/features/transactions/use-category-label';
import { useTheme } from '@/hooks/use-theme';

type Props = { row: ImportPreviewRow; included: boolean; onToggle: (key: string) => void };

/** A statement line on the preview; tapping includes or excludes it. */
export function PreviewRow({ row, included, onToggle }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { timeZone, locale } = useRegion();
  const categoryLabel = useCategoryLabel();
  const date = formatYmd(ymdInZone(row.date, timeZone), locale);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: included }}
      onPress={() => onToggle(row.key)}
      style={({ pressed }) => [styles.row, { opacity: !included ? 0.4 : pressed ? 0.7 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>
        <Text>{categoryEmoji(row.category)}</Text>
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {row.description || categoryLabel(row.category)}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>
          {`${date} · ${categoryLabel(row.category)} · ${t(`transactions.type.${row.type}`)}`}
        </Text>
      </View>
      <AmountText amount={row.amount} type={row.type} style={!included ? styles.excluded : undefined} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: Spacing.half },
  title: { fontSize: 15, fontWeight: 500 },
  subtitle: { fontSize: 13 },
  excluded: { textDecorationLine: 'line-through' },
});
