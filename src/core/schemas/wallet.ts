import { z } from 'zod';

import { id, nonNegativeMoney, positiveMoney, requiredText, V, ymd } from '../validation';

export const WALLET_NAME_MAX_LENGTH = 50;

export const walletSchema = z.object({
  name: requiredText(WALLET_NAME_MAX_LENGTH),
  balance: nonNegativeMoney,
  isDefault: z.boolean().default(false),
});

export const updateWalletSchema = z.object({
  id,
  name: requiredText(WALLET_NAME_MAX_LENGTH),
  /** Manual balance correction. */
  balance: nonNegativeMoney,
});

export const transferSchema = z
  .object({
    fromWalletId: id,
    toWalletId: id,
    amount: positiveMoney,
    date: ymd,
  })
  .refine((v) => v.fromWalletId !== v.toWalletId, { message: V.sameWallet, path: ['toWalletId'] });

export type WalletFormInput = z.input<typeof walletSchema>;
export type WalletInput = z.output<typeof walletSchema>;
export type UpdateWalletInput = z.output<typeof updateWalletSchema>;
export type TransferFormInput = z.input<typeof transferSchema>;
export type TransferInput = z.output<typeof transferSchema>;
