import { roundMoney } from '../number';
import type { ImportPreviewRow, StatementLine } from './types';

/** Row shape the import_transactions RPC expects. */
export type ImportRpcRow = {
  date: string;
  amount: number;
  type: ImportPreviewRow['type'];
  category: string;
  description: string;
  order: number;
};

export function toImportRpcRows(rows: readonly ImportPreviewRow[]): ImportRpcRow[] {
  return rows.map(({ date, amount, type, category, description, order }) => ({
    date,
    amount,
    type,
    category,
    description,
    order,
  }));
}

/**
 * The bank's balance after the newest line (latest instant, then highest order), or null when
 * the statement has no balance column for it.
 */
export function statementFinalBalance(lines: readonly StatementLine[]): number | null {
  let newest: StatementLine | null = null;
  for (const line of lines) {
    if (!newest || line.date > newest.date || (line.date === newest.date && line.order > newest.order)) newest = line;
  }
  return newest?.balanceAfter == null ? null : roundMoney(newest.balanceAfter);
}

export type ImportPreviewTotals = { count: number; income: number; expense: number };

export function importPreviewTotals(rows: readonly ImportPreviewRow[]): ImportPreviewTotals {
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === 'income') income += r.amount;
    else expense += r.amount;
  }
  return { count: rows.length, income: roundMoney(income), expense: roundMoney(expense) };
}

/** Splits rows into RPC-sized batches (the RPC accepts at most 1000 rows). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
