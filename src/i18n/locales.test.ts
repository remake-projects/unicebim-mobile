import { describe, expect, it } from 'vitest';

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TRANSFER_CATEGORY } from '@/core/categories';
import { V } from '@/core/validation';
import en from './locales/en';
import tr from './locales/tr';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
  );
}

describe('locales', () => {
  it('have the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(tr).sort());
  });

  it('translate every category and validation code', () => {
    for (const c of [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, TRANSFER_CATEGORY]) {
      expect(tr.categories).toHaveProperty(c);
    }
    for (const code of Object.values(V)) {
      expect(tr.validation).toHaveProperty(code);
    }
  });
});
