import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field-group';
import { Stepper } from '@/components/ui/stepper';
import { TextField } from '@/components/ui/text-field';
import { splitEqually } from '@/core/bill-splitter';
import { parseMoneyInput } from '@/core/money';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { equalShareText } from '../share-text';
import { useShareMessage } from '../use-share-message';
import { ResultCard } from './result-card';
import { TipPicker } from './tip-picker';

const MAX_PEOPLE = 50;

type Props = {
  iban: string;
  /** The IBAN field, shown just above the share button. */
  ibanField: ReactNode;
};

export function EqualSplit({ iban, ibanField }: Props) {
  const { t } = useTranslation();
  const format = useFormatMoney();
  const { locale, currency } = useRegion();
  const share = useShareMessage();
  const [amount, setAmount] = useState('');
  const [people, setPeople] = useState(2);
  const [tipPercent, setTipPercent] = useState(0);
  const subtotal = parseMoneyInput(amount, locale) ?? 0;
  const split = splitEqually(subtotal, people, tipPercent);

  return (
    <>
      <TextField
        label={`${t('billSplitter.total')} (${currency})`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder="0"
      />
      <FieldGroup label={t('billSplitter.people')}>
        <Stepper
          value={people}
          onChange={setPeople}
          min={1}
          max={MAX_PEOPLE}
          decreaseLabel={t('billSplitter.decrease')}
          increaseLabel={t('billSplitter.increase')}
        />
      </FieldGroup>
      <TipPicker value={tipPercent} onChange={setTipPercent} />
      <ResultCard
        lines={[
          ...(split.tip > 0 ? [{ label: t('billSplitter.tip'), value: format(split.tip) }] : []),
          { label: t('billSplitter.grandTotal'), value: format(split.total) },
          { label: t('billSplitter.perPerson'), value: format(split.perPerson), emphasis: true },
        ]}
      />
      {ibanField}
      <Button
        title={t('billSplitter.share')}
        disabled={split.total <= 0}
        onPress={() => share(equalShareText(split, people, { t, format, tipPercent, tip: split.tip, iban }))}
      />
    </>
  );
}
