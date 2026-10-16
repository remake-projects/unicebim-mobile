import type { TransactionType } from './categories';
import type { CategoryAmount } from './insights';
import { roundMoney } from './number';

export type ReportEntry = { type: TransactionType; category: string; amount: number };

export type ReportTotals = { count: number; income: number; expense: number; net: number };

export function reportTotals(entries: readonly ReportEntry[]): ReportTotals {
  let income = 0;
  let expense = 0;
  for (const e of entries) {
    if (e.type === 'income') income += e.amount;
    else expense += e.amount;
  }
  return {
    count: entries.length,
    income: roundMoney(income),
    expense: roundMoney(expense),
    net: roundMoney(income - expense),
  };
}

/** Expense total per category (input for getExpenseBreakdown). */
export function expenseByCategory(entries: readonly ReportEntry[]): CategoryAmount[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    if (e.type === 'expense') totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
  }
  return [...totals].map(([category, amount]) => ({ category, amount: roundMoney(amount) }));
}

export type CsvCell = string | number | null | undefined;

/**
 * Text starting with one of these is run as a formula by spreadsheet apps. Descriptions come from
 * bank statements, so a transfer note like `=HYPERLINK(…)` would otherwise execute on open.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value: CsvCell): string {
  // Numbers are written as numbers; only text can smuggle in a formula.
  const text = value == null ? '' : typeof value === 'string' && FORMULA_START.test(value) ? `'${value}` : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * RFC 4180 CSV (comma separated, CRLF line ends) with a UTF-8 byte order mark, so spreadsheet
 * apps read non-ASCII text correctly. Numbers are written with a "." decimal point; text that would
 * start a formula is prefixed with an apostrophe (OWASP CSV injection guidance).
 */
export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
