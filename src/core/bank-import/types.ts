import type { TransactionType, UserCategory } from '../categories';

export type BankId = 'ziraat' | 'is-bank';

/** One statement line as read from the bank file. */
export type StatementLine = {
  /** Instant of the transaction (UTC ISO). */
  date: string;
  /** Signed amount: negative = money out. */
  signedAmount: number;
  description: string;
  balanceAfter: number | null;
  /** Position among lines with the same timestamp (keeps statement order). */
  order: number;
};

export type ParseIssue = { row: number; code: 'invalidDate' | 'invalidAmount' | 'invalidBalance' };

export type StatementParseResult =
  | { ok: true; lines: StatementLine[]; issues: ParseIssue[] }
  | { ok: false; error: 'emptyFile' | 'headerNotFound' };

/** Editable row shown on the import preview screen. */
export type ImportPreviewRow = {
  key: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: UserCategory;
  description: string;
  order: number;
};

/** Raw sheet: rows of cells as returned by a spreadsheet reader (e.g. SheetJS `header: 1`). */
export type SheetRows = readonly (readonly unknown[] | null | undefined)[];
