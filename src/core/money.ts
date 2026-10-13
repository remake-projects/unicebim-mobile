export type FormatMoneyOptions = {
  currency: string;
  locale?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
};

export function formatMoney(amount: number, options: FormatMoneyOptions): string {
  const { currency, locale, maximumFractionDigits = 2, minimumFractionDigits = 0 } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits,
    minimumFractionDigits: Math.min(minimumFractionDigits, maximumFractionDigits),
  }).format(amount);
}

function decimalSeparatorFor(locale?: string): string {
  const part = new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal');
  return part?.value ?? '.';
}

/**
 * Parse a user- or bank-provided money string that may use either `.` or `,` as the
 * decimal separator and the other as a thousands separator ("1.234,56", "1,234.56",
 * "12,5", "-45.00 TL"). Returns null when the input is not a number.
 *
 * Ambiguous single separators ("1.234") are resolved with the locale's decimal separator.
 */
export function parseMoneyInput(input: unknown, locale?: string): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;

  let s = input.replace(/[\s  ']/g, '').replace(/[^\d.,+-]/g, '');
  const negative = s.startsWith('-');
  s = s.replace(/[+-]/g, '');
  if (!/\d/.test(s)) return null;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  let decimalSep: '.' | ',' | null = null;

  if (lastDot !== -1 && lastComma !== -1) {
    decimalSep = lastDot > lastComma ? '.' : ',';
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ',';
    const occurrences = s.split(sep).length - 1;
    const digitsAfter = s.length - s.lastIndexOf(sep) - 1;
    const looksLikeGrouping = digitsAfter === 3 && /^\d{1,3}([.,]\d{3})+$/.test(s);
    if (occurrences > 1) {
      decimalSep = null; // "1.234.567" → grouping only
    } else if (looksLikeGrouping) {
      decimalSep = decimalSeparatorFor(locale) === sep ? sep : null;
    } else {
      decimalSep = sep;
    }
  }

  const normalized =
    decimalSep === null
      ? s.replace(/[.,]/g, '')
      : s.replace(new RegExp(`\\${decimalSep === '.' ? ',' : '.'}`, 'g'), '').replace(decimalSep, '.');

  if (!/^\d*\.?\d*$/.test(normalized) || normalized === '.' || normalized === '') return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}
