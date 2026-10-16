import { describe, expect, it } from 'vitest';

import { testT } from '@/test/i18n';
import { buildReportCsv } from './report-csv';

const tx = (over: object) => ({
  id: '1',
  walletId: 'w1',
  amount: 12.5,
  type: 'expense' as const,
  category: 'food',
  date: '2026-10-15T22:30:00.000Z',
  description: 'Kahve, simit',
  isTransfer: false,
  transferGroupId: null,
  ...over,
});

describe('buildReportCsv', () => {
  it('writes translated headers and rows on the local calendar day', async () => {
    const t = await testT('tr');
    const csv = buildReportCsv([tx({}), tx({ id: '2', walletId: null, type: 'income', category: 'job', description: null })], {
      t,
      categoryLabel: (c) => t(`categories.${c as 'food'}`),
      walletNames: new Map([['w1', 'Nakit']]),
      timeZone: 'Europe/Istanbul',
      currency: 'TRY',
    });
    expect(csv.split('\r\n').slice(0, 3)).toEqual([
      '﻿Tarih,Tür,Kategori,Açıklama,Cüzdan,Tutar,Para birimi',
      '2026-10-16,Gider,Beslenme,"Kahve, simit",Nakit,12.5,TRY',
      '2026-10-16,Gelir,İş / Freelance,,Cüzdansız,12.5,TRY',
    ]);
  });
});
