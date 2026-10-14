import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { formatYmd, type Ymd } from '@/core/time';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  /** null = no date chosen yet (optional fields pass `onClear`). */
  value: Ymd | null;
  onChange: (value: Ymd) => void;
  onClear?: () => void;
  /** Where the picker starts when `value` is null. */
  initialDate: Ymd;
  /** Formatting locale for the closed field. */
  locale: string;
  minimumDate?: Ymd;
  maximumDate?: Ymd;
  error?: string;
};

// The native pickers work with the device's local calendar day; noon avoids DST edges.
function ymdToLocalDate(ymd: Ymd): Date {
  const [y, m, d] = ymd.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
}

function localDateToYmd(date: Date): Ymd {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Calendar date input; values are `YYYY-MM-DD` strings. iOS shows the compact inline
 * picker, Android a button that opens the Material date dialog.
 */
export function DateField(props: Props) {
  const { label, value, onChange, onClear, initialDate, locale, minimumDate, maximumDate, error } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isIos = Platform.OS === 'ios';

  const picker = (extra: { presentation?: 'dialog'; display?: 'compact' }) => (
    <DateTimePicker
      mode="date"
      value={ymdToLocalDate(value ?? initialDate)}
      minimumDate={minimumDate ? ymdToLocalDate(minimumDate) : undefined}
      maximumDate={maximumDate ? ymdToLocalDate(maximumDate) : undefined}
      accentColor={theme.primary}
      onValueChange={(_, date) => {
        setDialogOpen(false);
        onChange(localDateToYmd(date));
      }}
      onDismiss={() => setDialogOpen(false)}
      {...extra}
    />
  );

  const openButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => (isIos ? onChange(initialDate) : setDialogOpen(true))}
      style={[styles.button, { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border }]}>
      <Text style={[styles.value, { color: value ? theme.text : theme.textSecondary }]}>
        {value ? formatYmd(value, locale) : t('common.pickDate')}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <View style={styles.controls}>
          {isIos && value ? picker({ display: 'compact' }) : openButton}
          {onClear && value ? (
            <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
              <Text style={[styles.clear, { color: theme.textSecondary }]}>{t('common.clear')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {!isIos && dialogOpen ? picker({ presentation: 'dialog' }) : null}
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, minHeight: 48 },
  label: { flexShrink: 1, fontSize: 14, fontWeight: 600 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  button: { minHeight: 40, paddingHorizontal: Spacing.three, borderRadius: Radius.md, borderWidth: 1, justifyContent: 'center' },
  value: { fontSize: 16 },
  clear: { fontSize: 14, fontWeight: 500 },
  error: { fontSize: 13 },
});
