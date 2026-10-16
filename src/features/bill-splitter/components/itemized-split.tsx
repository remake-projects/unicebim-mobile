import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { splitItemized } from '@/core/bill-splitter';
import { parseMoneyInput } from '@/core/money';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';
import { itemizedShareText } from '../share-text';
import { useShareMessage } from '../use-share-message';
import { ResultCard } from './result-card';
import { TipPicker } from './tip-picker';

type Person = { id: number; name: string; amount: string };

const MAX_PEOPLE = 30;

type Props = {
  iban: string;
  /** The IBAN field, shown just above the share button. */
  ibanField: ReactNode;
};

export function ItemizedSplit({ iban, ibanField }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { locale, currency } = useRegion();
  const share = useShareMessage();
  const [people, setPeople] = useState<Person[]>([
    { id: 1, name: '', amount: '' },
    { id: 2, name: '', amount: '' },
  ]);
  const [tipPercent, setTipPercent] = useState(0);

  const displayName = (p: Person, index: number) => p.name.trim() || t('billSplitter.person', { n: index + 1 });
  const split = splitItemized(
    people.map((p, i) => ({ name: displayName(p, i), amount: parseMoneyInput(p.amount, locale) ?? 0 })),
    tipPercent
  );

  const update = (id: number, patch: Partial<Person>) =>
    setPeople((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const add = () => setPeople((list) => [...list, { id: Math.max(0, ...list.map((p) => p.id)) + 1, name: '', amount: '' }]);
  const remove = (id: number) => setPeople((list) => list.filter((p) => p.id !== id));

  return (
    <>
      {people.map((p, i) => (
        <View key={p.id} style={styles.person}>
          <View style={styles.name}>
            <TextField
              label={t('billSplitter.name')}
              value={p.name}
              onChangeText={(name) => update(p.id, { name })}
              placeholder={t('billSplitter.person', { n: i + 1 })}
            />
          </View>
          <View style={styles.amount}>
            <TextField
              label={`${t('billSplitter.amount')} (${currency})`}
              value={p.amount}
              onChangeText={(amount) => update(p.id, { amount })}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="0"
            />
          </View>
          {people.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('billSplitter.removePerson', { name: displayName(p, i) })}
              hitSlop={8}
              onPress={() => remove(p.id)}
              style={styles.remove}>
              <Text style={[styles.removeText, { color: theme.textSecondary }]}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {people.length < MAX_PEOPLE ? <Button variant="secondary" title={t('billSplitter.addPerson')} onPress={add} /> : null}
      <TipPicker value={tipPercent} onChange={setTipPercent} />
      <ResultCard
        lines={[
          ...split.shares.map((s) => ({ label: s.name, value: format(s.total) })),
          ...(split.tip > 0 ? [{ label: t('billSplitter.tip'), value: format(split.tip) }] : []),
          { label: t('billSplitter.grandTotal'), value: format(split.total), emphasis: true },
        ]}
      />
      {ibanField}
      <Button
        title={t('billSplitter.share')}
        disabled={split.total <= 0}
        onPress={() => share(itemizedShareText(split.total, split.shares, { t, format, tipPercent, tip: split.tip, iban }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  person: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  name: { flex: 3 },
  amount: { flex: 2 },
  remove: { width: 32, height: 48, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 24 },
});
