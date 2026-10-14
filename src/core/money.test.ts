import { describe, expect, it } from 'vitest';

import { formatMoney, formatMoneyInput, parseMoneyInput } from './money';

describe('parseMoneyInput', () => {
  it.each([
    ['12', 12],
    ['12,5', 12.5],
    ['12.5', 12.5],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['1.234.567', 1234567],
    ['-45,00 TL', -45],
    ['  250 ', 250],
    ['₺1.500,00', 1500],
  ])('parses %s', (input, expected) => {
    expect(parseMoneyInput(input, 'tr-TR')).toBe(expected);
  });

  it('resolves an ambiguous single separator with the locale', () => {
    expect(parseMoneyInput('1.234', 'tr-TR')).toBe(1234);
    expect(parseMoneyInput('1.234', 'en-US')).toBe(1.234);
    expect(parseMoneyInput('1,234', 'en-US')).toBe(1234);
  });

  it('returns null for non-numbers', () => {
    expect(parseMoneyInput('', 'tr-TR')).toBeNull();
    expect(parseMoneyInput('abc', 'tr-TR')).toBeNull();
    expect(parseMoneyInput(null, 'tr-TR')).toBeNull();
    expect(parseMoneyInput(Number.NaN, 'tr-TR')).toBeNull();
  });

  it('passes numbers through', () => {
    expect(parseMoneyInput(42.1)).toBe(42.1);
  });
});

describe('formatMoney', () => {
  it('formats with the given currency and locale', () => {
    expect(formatMoney(1500, { currency: 'USD', locale: 'en-US' })).toBe('$1,500');
    expect(formatMoney(12.5, { currency: 'EUR', locale: 'de-DE' }).replace(/\s/g, ' ')).toBe('12,5 €');
  });
});

describe('formatMoneyInput', () => {
  it('round-trips through parseMoneyInput in the same locale', () => {
    expect(formatMoneyInput(1234.5, 'tr-TR')).toBe('1234,5');
    expect(formatMoneyInput(1234.5, 'en-US')).toBe('1234.5');
    for (const locale of ['tr-TR', 'en-US', 'de-DE']) {
      expect(parseMoneyInput(formatMoneyInput(98765.43, locale), locale)).toBe(98765.43);
    }
  });
});
