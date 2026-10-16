import { getDocumentAsync } from 'expo-document-picker';
import { File } from 'expo-file-system';
import { read, utils } from 'xlsx';

import type { SheetRows } from '@/core/bank-import/types';

const STATEMENT_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

export type PickedStatement = { name: string; rows: SheetRows };

/** Bank exports are a few hundred kilobytes; anything far larger is not a statement. */
const MAX_STATEMENT_BYTES = 5 * 1024 * 1024;

/** The picked file is bigger than any statement; parsing it would only freeze the app. */
export class StatementTooLargeError extends Error {}

/**
 * Lets the user pick a bank's Excel export and returns its first sheet as rows of display text
 * (the bank parsers match dates and amounts as the bank formats them). Null when cancelled.
 */
export async function pickStatement(): Promise<PickedStatement | null> {
  const result = await getDocumentAsync({ type: STATEMENT_TYPES, copyToCacheDirectory: true });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  if ((asset.size ?? 0) > MAX_STATEMENT_BYTES) throw new StatementTooLargeError();
  const bytes = await new File(asset.uri).bytes();
  if (bytes.length > MAX_STATEMENT_BYTES) throw new StatementTooLargeError();
  const workbook = read(bytes, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
  const rows = sheet ? utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: false }) : [];
  return { name: asset.name, rows };
}
