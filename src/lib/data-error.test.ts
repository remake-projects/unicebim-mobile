import { describe, expect, it } from 'vitest';

import { AppError } from './app-error';
import { toDataErrorKey, unwrap } from './data-error';

describe('toDataErrorKey', () => {
  it('maps the SQLSTATEs the ledger raises', () => {
    expect(
      toDataErrorKey({ code: '23514', message: 'new row for relation "wallets" violates check constraint "wallets_balance_check"' })
    ).toBe('insufficientBalance');
    expect(toDataErrorKey({ code: '23514', message: 'violates check constraint "transactions_category_check"' })).toBe('generic');
    expect(toDataErrorKey({ code: 'P0002', message: 'wallet not found' })).toBe('notFound');
    expect(toDataErrorKey({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })).toBe('notFound');
    expect(toDataErrorKey({ code: '', message: 'TypeError: Network request failed' })).toBe('network');
    expect(toDataErrorKey({ code: '42501', message: 'permission denied' })).toBe('generic');
  });
});

describe('unwrap', () => {
  it('returns data or throws an AppError', () => {
    expect(unwrap({ data: [1], error: null })).toEqual([1]);
    expect(() => unwrap({ data: null, error: { code: 'P0002', message: 'x' } })).toThrow(AppError);
  });
});
