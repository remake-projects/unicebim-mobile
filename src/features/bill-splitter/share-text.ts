import type { TFunction } from 'i18next';

import type { EqualSplit } from '@/core/bill-splitter';
import { formatIban, isValidIban } from '@/core/iban';

type Common = { t: TFunction; format: (amount: number) => string; tipPercent: number; tip: number; iban: string };

function footer({ t, format, tipPercent, tip, iban }: Common): string[] {
  return [
    ...(tipPercent > 0 ? [t('billSplitter.shareTip', { percent: tipPercent, amount: format(tip) })] : []),
    ...(isValidIban(iban) ? [t('billSplitter.shareIban', { iban: formatIban(iban) })] : []),
  ];
}

/** Plain-text summary for messaging apps. */
export function equalShareText(split: EqualSplit, people: number, common: Common): string {
  const { t, format } = common;
  return [
    t('billSplitter.shareHeader', { total: format(split.total) }),
    t('billSplitter.sharePerPerson', { amount: format(split.perPerson), people }),
    ...footer(common),
  ].join('\n');
}

export function itemizedShareText(
  total: number,
  shares: readonly { name: string; total: number }[],
  common: Common
): string {
  const { t, format } = common;
  return [
    t('billSplitter.shareHeader', { total: format(total) }),
    ...shares.map((s) => t('billSplitter.shareLine', { name: s.name, amount: format(s.total) })),
    ...footer(common),
  ].join('\n');
}
