import { z } from 'zod';

import { parseMoneyInput } from './money';
import { isValidTimeZone, isYmd } from './time';

/**
 * Validation error codes. Schemas emit these as issue messages; the UI translates
 * them with i18n (`validation.<code>`).
 */
export const V = {
  required: 'required',
  tooLong: 'tooLong',
  tooShort: 'tooShort',
  amountPositive: 'amountPositive',
  amountNonNegative: 'amountNonNegative',
  invalidAmount: 'invalidAmount',
  invalidDate: 'invalidDate',
  dateInPast: 'dateInPast',
  invalidCategory: 'invalidCategory',
  invalidId: 'invalidId',
  sameWallet: 'sameWallet',
  invalidEmail: 'invalidEmail',
  passwordTooShort: 'passwordTooShort',
  passwordsDontMatch: 'passwordsDontMatch',
  passwordUnchanged: 'passwordUnchanged',
  termsRequired: 'termsRequired',
  invalidCurrency: 'invalidCurrency',
  invalidTimeZone: 'invalidTimeZone',
} as const;

export type ValidationCode = (typeof V)[keyof typeof V];

export const PASSWORD_MIN_LENGTH = 8;
export const DESCRIPTION_MAX_LENGTH = 500;

const toMoney = (val: unknown) => (val === '' || val == null ? undefined : (parseMoneyInput(val) ?? Number.NaN));

/** Money input (string from a text field or number) that must be > 0. */
export const positiveMoney = z.preprocess(
  toMoney,
  z.number({ error: V.invalidAmount }).refine(Number.isFinite, V.invalidAmount).refine((n) => n > 0, V.amountPositive)
);

/** Money input that must be ≥ 0 (e.g. a wallet's opening balance). */
export const nonNegativeMoney = z.preprocess(
  toMoney,
  z.number({ error: V.invalidAmount }).refine(Number.isFinite, V.invalidAmount).refine((n) => n >= 0, V.amountNonNegative)
);

/** Optional positive money; empty input becomes null. */
export const optionalPositiveMoney = z.preprocess(
  (val) => (val === '' || val == null ? null : toMoney(val)),
  z.number().refine(Number.isFinite, V.invalidAmount).refine((n) => n > 0, V.amountPositive).nullable()
);

export const ymd = z.string({ error: V.invalidDate }).refine(isYmd, V.invalidDate);

export const optionalYmd = z.preprocess((val) => (val === '' || val == null ? null : val), ymd.nullable());

export const id = z.uuid({ error: V.invalidId });

export const requiredText = (max: number) =>
  z.string({ error: V.required }).trim().min(1, V.required).max(max, V.tooLong);

export const currencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/, V.invalidCurrency);

export const timeZone = z.string().refine(isValidTimeZone, V.invalidTimeZone);
