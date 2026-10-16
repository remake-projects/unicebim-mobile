import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TextField } from '@/components/ui/text-field';
import { isValidIban } from '@/core/iban';
import { EqualSplit } from '@/features/bill-splitter/components/equal-split';
import { ItemizedSplit } from '@/features/bill-splitter/components/itemized-split';

type Mode = 'equal' | 'itemized';

/** Works entirely on the device; nothing is saved. */
export default function BillSplitterScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('equal');
  const [iban, setIban] = useState('');
  const ibanField = (
    <TextField
      label={t('billSplitter.iban')}
      value={iban}
      onChangeText={setIban}
      autoCapitalize="characters"
      autoCorrect={false}
      placeholder="TR00 0000 0000 0000 0000 0000 00"
      error={iban.trim() && !isValidIban(iban) ? t('billSplitter.ibanInvalid') : undefined}
    />
  );

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <SegmentedControl
        options={[
          { value: 'equal', label: t('billSplitter.equal') },
          { value: 'itemized', label: t('billSplitter.itemized') },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'equal' ? (
        <EqualSplit iban={iban} ibanField={ibanField} />
      ) : (
        <ItemizedSplit iban={iban} ibanField={ibanField} />
      )}
    </Screen>
  );
}
