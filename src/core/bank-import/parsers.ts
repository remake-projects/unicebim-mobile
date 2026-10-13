import { parseMoneyInput } from '../money';
import { zonedWallClockToInstant } from '../time';
import type { BankId, ParseIssue, SheetRows, StatementLine, StatementParseResult } from './types';

/** Turkish bank exports are in Turkey's local time regardless of the user's time zone. */
const BANK_TIME_ZONE = 'Europe/Istanbul';
const BANK_LOCALE = 'tr-TR';

type BankFormat = {
  isHeader: (firstCell: string) => boolean;
  /** Rows between the header and the first transaction row. */
  firstDataOffset: number;
  columns: { date: number; amount: number; balance: number; description: number };
  /** Returns wall-clock parts or null when the cell is not a date. */
  parseDate: (cell: string) => { year: number; month: number; day: number; hour: number; minute: number; second: number } | null;
};

const FORMATS: Record<BankId, BankFormat> = {
  ziraat: {
    isHeader: (c) => c.includes('Hesap Hareketleri'),
    firstDataOffset: 2,
    columns: { date: 0, description: 2, amount: 3, balance: 4 },
    parseDate: (c) => {
      const m = c.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      // Date only: use local noon so the entry stays on the same calendar day.
      return m ? { day: +m[1]!, month: +m[2]!, year: +m[3]!, hour: 12, minute: 0, second: 0 } : null;
    },
  },
  'is-bank': {
    isHeader: (c) => c === 'Tarih/Saat',
    firstDataOffset: 1,
    columns: { date: 0, amount: 3, balance: 4, description: 8 },
    parseDate: (c) => {
      const m = c.match(/^(\d{2})\/(\d{2})\/(\d{4})-(\d{2}):(\d{2}):(\d{2})$/);
      return m ? { day: +m[1]!, month: +m[2]!, year: +m[3]!, hour: +m[4]!, minute: +m[5]!, second: +m[6]! } : null;
    },
  },
};

const cellText = (v: unknown) => (v == null ? '' : String(v).trim());

/**
 * Parse a bank statement sheet into signed statement lines.
 * Pure: no I/O and no duplicate detection (the import RPC deduplicates).
 */
export function parseBankStatement(bank: BankId, rows: SheetRows): StatementParseResult {
  if (rows.length === 0) return { ok: false, error: 'emptyFile' };
  const format = FORMATS[bank];
  const headerIndex = rows.findIndex((r) => r != null && format.isHeader(cellText(r[0])));
  if (headerIndex === -1) return { ok: false, error: 'headerNotFound' };

  const lines: StatementLine[] = [];
  const issues: ParseIssue[] = [];
  let previousDate: string | null = null;
  let order = 0;

  for (let i = headerIndex + format.firstDataOffset; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const dateCell = cellText(row[format.columns.date]);
    if (!dateCell) break; // end of the transaction block

    const wall = format.parseDate(dateCell);
    if (!wall) {
      issues.push({ row: i + 1, code: 'invalidDate' });
      continue;
    }
    const signedAmount = parseMoneyInput(cellText(row[format.columns.amount]), BANK_LOCALE);
    if (signedAmount == null || signedAmount === 0) {
      issues.push({ row: i + 1, code: 'invalidAmount' });
      continue;
    }
    const balanceText = cellText(row[format.columns.balance]);
    const balanceAfter = balanceText ? parseMoneyInput(balanceText, BANK_LOCALE) : null;
    if (balanceText && balanceAfter == null) {
      issues.push({ row: i + 1, code: 'invalidBalance' });
      continue;
    }

    const date = zonedWallClockToInstant(wall, BANK_TIME_ZONE).toISOString();
    order = date === previousDate ? order + 1 : 0;
    previousDate = date;

    lines.push({
      date,
      signedAmount,
      description: cellText(row[format.columns.description]),
      balanceAfter,
      order,
    });
  }

  return { ok: true, lines, issues };
}
