import type { TFunction } from 'i18next';

import { V, type ValidationCode } from '@/core/validation';
import { AppError, type ErrorKey } from '@/lib/app-error';

const CODES = new Set<string>(Object.values(V));

/** Translate a zod issue message (a validation code) for display under a field. */
export function validationMessage(t: TFunction, code: string | undefined): string | undefined {
  if (!code) return undefined;
  return CODES.has(code) ? t(`validation.${code as ValidationCode}`) : t('errors.generic');
}

/** Translate any thrown error; unknown errors get the generic message. */
export function errorMessage(t: TFunction, error: unknown): string {
  const key: ErrorKey = error instanceof AppError ? error.key : 'generic';
  return t(`errors.${key}`);
}
