import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { FieldGroup } from '@/components/ui/field-group';
import { FormMessage } from '@/components/ui/form-message';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { parseBankStatement } from '@/core/bank-import/parsers';
import { statementFinalBalance } from '@/core/bank-import/payload';
import { buildImportPreview } from '@/core/bank-import/preview';
import type { BankId } from '@/core/bank-import/types';
import { StatementPreview, type ParsedStatement } from '@/features/bank-import/components/statement-preview';
import type { ImportResult } from '@/features/bank-import/import-api';
import { pickStatement } from '@/features/bank-import/read-statement';
import { useImportStatement } from '@/features/bank-import/use-import';
import { useWalletOptions } from '@/features/wallets/use-wallet-options';
import { useWallets } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';

const BANKS: readonly BankId[] = ['ziraat', 'is-bank'];

type ParseError = 'emptyFile' | 'headerNotFound' | 'unreadable' | 'noLines';

export default function BankImportScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ walletId?: string }>();
  const wallets = useWallets();
  const walletOptions = useWalletOptions(wallets.data ?? []);
  const importStatement = useImportStatement();
  const [bank, setBank] = useState<BankId>('ziraat');
  const [walletId, setWalletId] = useState<string | null>(params.walletId ?? null);
  const [statement, setStatement] = useState<ParsedStatement | null>(null);
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [picking, setPicking] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  if (wallets.isError) return <ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />;
  if (!wallets.data) return <LoadingState />;
  const targetWallet = walletId ?? wallets.data.find((w) => w.isDefault)?.id ?? wallets.data[0]?.id ?? null;

  async function pick() {
    setParseError(null);
    setPicking(true);
    try {
      const picked = await pickStatement();
      if (!picked) return;
      const parsed = parseBankStatement(bank, picked.rows);
      if (!parsed.ok) return setParseError(parsed.error);
      if (!parsed.lines.length) return setParseError('noLines');
      const finalBalance = statementFinalBalance(parsed.lines);
      setStatement({
        fileName: picked.name,
        rows: buildImportPreview(parsed.lines),
        issueCount: parsed.issues.length,
        // The wallet cannot go below zero, so an overdrawn balance is not offered.
        finalBalance: finalBalance != null && finalBalance >= 0 ? finalBalance : null,
      });
    } catch {
      setParseError('unreadable');
    } finally {
      setPicking(false);
    }
  }

  if (result) {
    return (
      <Screen edges={UNDER_HEADER_EDGES}>
        <Card>
          <Text style={[styles.done, { color: theme.text }]}>{t('bankImport.done')}</Text>
          <Text style={{ color: theme.text }}>{t('bankImport.inserted', { count: result.inserted })}</Text>
          {result.skipped ? (
            <Text style={{ color: theme.textSecondary }}>{t('bankImport.skipped', { count: result.skipped })}</Text>
          ) : null}
        </Card>
        <Button title={t('bankImport.finish')} onPress={() => router.back()} />
      </Screen>
    );
  }

  if (statement && targetWallet) {
    return (
      <Screen edges={UNDER_HEADER_EDGES}>
        <StatementPreview
          statement={statement}
          onPickAnother={() => setStatement(null)}
          onImport={async (rows, finalBalance) => {
            setResult(await importStatement.mutateAsync({ walletId: targetWallet, rows, finalBalance }));
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <FieldGroup label={t('bankImport.bank')}>
        <SegmentedControl
          options={BANKS.map((b) => ({ value: b, label: t(`bankImport.banks.${b}`) }))}
          value={bank}
          onChange={setBank}
          accessibilityLabel={t('bankImport.bank')}
        />
      </FieldGroup>
      <FieldGroup label={t('bankImport.wallet')}>
        <ChoiceChips options={walletOptions} value={targetWallet} onChange={setWalletId} />
      </FieldGroup>
      <FormMessage message={parseError ? t(`bankImport.errors.${parseError}`) : null} />
      <FieldGroup label={t('bankImport.pick')} hint={t('bankImport.pickHint')}>
        <Button title={t('bankImport.pick')} loading={picking} disabled={!targetWallet} onPress={pick} />
      </FieldGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  done: { fontSize: 20, fontWeight: 700 },
});
