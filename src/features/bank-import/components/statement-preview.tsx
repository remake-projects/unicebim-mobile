import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/ui/form-message';
import { Spacing } from '@/constants/theme';
import { importPreviewTotals, toImportRpcRows, type ImportRpcRow } from '@/core/bank-import/payload';
import type { ImportPreviewRow } from '@/core/bank-import/types';
import { useFormatMoney } from '@/features/profile/use-region';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useTheme } from '@/hooks/use-theme';
import { PreviewRow } from './preview-row';

export type ParsedStatement = {
  fileName: string;
  rows: ImportPreviewRow[];
  issueCount: number;
  /** Bank balance after the newest line; null when unknown or negative. */
  finalBalance: number | null;
};

type Props = {
  statement: ParsedStatement;
  onImport: (rows: ImportRpcRow[], finalBalance: number | null) => Promise<unknown>;
  onPickAnother: () => void;
};

/** Lets the user leave lines out and choose whether to sync the balance, then imports. */
export function StatementPreview({ statement, onImport, onPickAnother }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const [syncBalance, setSyncBalance] = useState(statement.finalBalance != null);
  const [busy, setBusy] = useState(false);
  const included = statement.rows.filter((r) => !excluded.has(r.key));
  const totals = importPreviewTotals(included);
  const { error, submit } = useFormSubmit(() =>
    onImport(toImportRpcRows(included), syncBalance ? statement.finalBalance : null)
  );

  function toggle(key: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  async function run() {
    setBusy(true);
    await submit(undefined);
    setBusy(false);
  }

  return (
    <View style={styles.container}>
      <Card>
        <Text style={{ color: theme.textSecondary }}>{t('bankImport.file', { name: statement.fileName })}</Text>
        <Text style={[styles.count, { color: theme.text }]}>{t('bankImport.lines', { count: statement.rows.length })}</Text>
        <Text style={{ color: theme.success }}>{`${t('summary.income')}: ${format(totals.income)}`}</Text>
        <Text style={{ color: theme.text }}>{`${t('summary.expense')}: ${format(totals.expense)}`}</Text>
        {statement.issueCount ? (
          <Text style={{ color: theme.warning }}>{t('bankImport.issues', { count: statement.issueCount })}</Text>
        ) : null}
      </Card>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>{t('bankImport.excludeHint')}</Text>
      <View>
        {statement.rows.map((row) => (
          <PreviewRow key={row.key} row={row} included={!excluded.has(row.key)} onToggle={toggle} />
        ))}
      </View>
      {statement.finalBalance != null ? (
        <Checkbox
          label={t('bankImport.syncBalance', { amount: format(statement.finalBalance) })}
          checked={syncBalance}
          onChange={setSyncBalance}
        />
      ) : null}
      <FormMessage message={error} />
      <Button
        title={t('bankImport.submit', { count: totals.count })}
        loading={busy}
        disabled={totals.count === 0}
        onPress={run}
      />
      <Button variant="ghost" title={t('bankImport.otherFile')} disabled={busy} onPress={onPickAnother} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  count: { fontSize: 20, fontWeight: 700 },
  hint: { fontSize: 13, lineHeight: 18 },
});
