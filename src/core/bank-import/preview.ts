import { roundMoney } from '../number';
import { detectCategory } from './detect-category';
import type { ImportPreviewRow, StatementLine } from './types';

/**
 * Turn parsed statement lines into editable preview rows. The sign from the bank decides the
 * type (the web app dropped the sign, so incoming money was imported as expenses).
 */
export function buildImportPreview(lines: readonly StatementLine[]): ImportPreviewRow[] {
  return lines.map((line, index) => {
    const type = line.signedAmount < 0 ? 'expense' : 'income';
    return {
      key: `${index}`,
      date: line.date,
      amount: roundMoney(Math.abs(line.signedAmount)),
      type,
      category: detectCategory(line.description, type),
      description: line.description,
      order: line.order,
    };
  });
}
