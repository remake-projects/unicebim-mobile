import { useTranslation } from 'react-i18next';

import { ChoiceChips } from '@/components/ui/choice-chips';
import { FieldGroup } from '@/components/ui/field-group';
import { TIP_OPTIONS } from '@/core/bill-splitter';

export function TipPicker({ value, onChange }: { value: number; onChange: (percent: number) => void }) {
  const { t } = useTranslation();
  return (
    <FieldGroup label={t('billSplitter.tip')}>
      <ChoiceChips
        options={TIP_OPTIONS.map((p) => ({ value: String(p), label: p === 0 ? t('billSplitter.noTip') : `%${p}` }))}
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
        accessibilityLabel={t('billSplitter.tip')}
      />
    </FieldGroup>
  );
}
