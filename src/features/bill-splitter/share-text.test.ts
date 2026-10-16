import { describe, expect, it } from 'vitest';

import { splitEqually } from '@/core/bill-splitter';
import { testT } from '@/test/i18n';
import { equalShareText, itemizedShareText } from './share-text';

const format = (n: number) => `€${n.toFixed(2)}`;

describe('bill splitter share text', () => {
  it('summarizes an equal split with tip and a valid IBAN', async () => {
    const t = await testT('en');
    const split = splitEqually(100, 4, 10);
    expect(equalShareText(split, 4, { t, format, tipPercent: 10, tip: split.tip, iban: 'de89370400440532013000' })).toBe(
      ['Bill: €110.00', 'Per person: €27.50 (4 people)', 'Tip: 10% (€10.00)', 'IBAN: DE89 3704 0044 0532 0130 00'].join('\n')
    );
  });

  it('leaves out a zero tip and an invalid IBAN', async () => {
    const t = await testT('tr');
    const text = itemizedShareText(30, [{ name: 'Ada', total: 20 }, { name: 'Can', total: 10 }], {
      t,
      format,
      tipPercent: 0,
      tip: 0,
      iban: 'TR00 1234',
    });
    expect(text).toBe(['Hesap: €30.00', 'Ada: €20.00', 'Can: €10.00'].join('\n'));
  });
});
