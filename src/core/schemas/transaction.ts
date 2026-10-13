import { z } from 'zod';

import { isCategoryForType, USER_CATEGORIES } from '../categories';
import { DESCRIPTION_MAX_LENGTH, id, positiveMoney, V, ymd } from '../validation';

const transactionFields = {
  amount: positiveMoney,
  type: z.enum(['income', 'expense']),
  category: z.enum(USER_CATEGORIES as [string, ...string[]], { error: V.invalidCategory }),
  /** Calendar date chosen by the user; converted with transactionInstantForDate. */
  date: ymd,
  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX_LENGTH, V.tooLong)
    .nullish()
    .transform((v) => v || null),
  walletId: id.nullish().transform((v) => v ?? null),
};

function categoryMatchesType(val: { type: 'income' | 'expense'; category: string }, ctx: z.RefinementCtx) {
  if (!isCategoryForType(val.type, val.category)) {
    ctx.addIssue({ code: 'custom', message: V.invalidCategory, path: ['category'] });
  }
}

export const transactionSchema = z.object(transactionFields).superRefine(categoryMatchesType);
export const updateTransactionSchema = z.object({ id, ...transactionFields }).superRefine(categoryMatchesType);

export type TransactionFormInput = z.input<typeof transactionSchema>;
export type TransactionInput = z.output<typeof transactionSchema>;
export type UpdateTransactionInput = z.output<typeof updateTransactionSchema>;
