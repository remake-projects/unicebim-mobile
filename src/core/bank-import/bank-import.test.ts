import { describe, expect, it } from 'vitest';

import { detectCategory } from './detect-category';
import { parseBankStatement } from './parsers';
import { buildImportPreview } from './preview';

const ziraatRows = [
  ['ZİRAAT BANKASI'],
  ['Hesap Hareketleri'],
  ['Tarih', 'Fiş', 'Açıklama', 'Tutar', 'Bakiye'],
  ['01.10.2026', '1', 'KYK BURS ODEMESI', '3.000,00', '3.500,00'],
  ['01.10.2026', '2', 'MİGROS TİC. A.Ş.', '-1.234,56', '2.265,44'],
  ['02.10.2026', '3', 'BILINMEYEN', 'abc', '2.265,44'],
  [],
  ['', '', 'Toplam'],
];

describe('parseBankStatement', () => {
  it('keeps the sign and handles Turkish thousands separators', () => {
    const r = parseBankStatement('ziraat', ziraatRows);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lines.map((l) => [l.signedAmount, l.balanceAfter, l.order])).toEqual([
      [3000, 3500, 0],
      [-1234.56, 2265.44, 1],
    ]);
    expect(r.lines[0]!.date).toBe('2026-10-01T09:00:00.000Z'); // noon in Istanbul
    expect(r.issues).toEqual([{ row: 6, code: 'invalidAmount' }]);
  });

  it('parses İş Bankası timestamps in Turkish time', () => {
    const rows = [['Tarih/Saat', '', '', 'Tutar', 'Bakiye', '', '', '', 'Açıklama'], ['05/10/2026-14:30:00', '', '', '-50,00', '100,00', '', '', '', 'BITAKSI']];
    const r = parseBankStatement('is-bank', rows);
    expect(r.ok && r.lines[0]).toMatchObject({ date: '2026-10-05T11:30:00.000Z', signedAmount: -50, description: 'BITAKSI' });
  });

  it('reports a missing header', () => {
    expect(parseBankStatement('is-bank', ziraatRows)).toEqual({ ok: false, error: 'headerNotFound' });
    expect(parseBankStatement('ziraat', [])).toEqual({ ok: false, error: 'emptyFile' });
  });
});

describe('buildImportPreview', () => {
  it('derives type from the sign and detects categories', () => {
    const r = parseBankStatement('ziraat', ziraatRows);
    if (!r.ok) throw new Error('parse failed');
    expect(buildImportPreview(r.lines).map((p) => [p.type, p.category, p.amount])).toEqual([
      ['income', 'scholarship', 3000],
      ['expense', 'food', 1234.56],
    ]);
  });
});

describe('detectCategory', () => {
  it('matches whole-word starts, case and diacritic insensitive', () => {
    expect(detectCategory('ŞOK MARKETLERİ', 'expense')).toBe('food');
    expect(detectCategory('ISTANBULKART DOLUM', 'expense')).toBe('transport');
    expect(detectCategory('BARKOD ODEME', 'expense')).toBe('other'); // "bar" no longer matches inside words
    expect(detectCategory('susam', 'expense')).toBe('other'); // "su" (water) was a substring false positive
    expect(detectCategory('EFT MAAS', 'income')).toBe('job');
    expect(detectCategory('anything', 'income')).toBe('other');
  });
});
