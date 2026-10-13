import type { TFunction } from 'i18next';

import { V, type ValidationCode } from '@/core/validation';

const CODES = new Set<string>(Object.values(V));

/** Translate a zod issue message (a validation code) for display under a field. */
export function validationMessage(t: TFunction, code: string | undefined): string | undefined {
  if (!code) return undefined;
  return CODES.has(code) ? t(`validation.${code as ValidationCode}`) : t('errors.generic');
}
