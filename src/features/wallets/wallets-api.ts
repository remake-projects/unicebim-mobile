import { toNumberOrZero } from '@/core/number';
import type { TransferInput, UpdateWalletInput, WalletInput } from '@/core/schemas/wallet';
import { transactionInstantForDate } from '@/core/time';
import type { Database } from '@/data/database.types';
import { unwrap } from '@/lib/data-error';
import { supabase } from '@/lib/supabase';

type WalletRow = Database['public']['Tables']['wallets']['Row'];

export type Wallet = { id: string; name: string; balance: number; isDefault: boolean };

function toWallet(row: WalletRow): Wallet {
  return { id: row.id, name: row.name, balance: toNumberOrZero(row.balance), isDefault: row.is_default };
}

/** Default wallet first, then oldest first. */
export async function fetchWallets(): Promise<Wallet[]> {
  const rows = unwrap(
    await supabase
      .from('wallets')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
  );
  return rows.map(toWallet);
}

export async function createWallet(userId: string, input: WalletInput): Promise<Wallet> {
  // Inserted as non-default: only one default may exist, set_default_wallet swaps it.
  const row = unwrap(
    await supabase
      .from('wallets')
      .insert({ user_id: userId, name: input.name, balance: input.balance, is_default: false })
      .select('*')
      .single()
  );
  if (input.isDefault) await setDefaultWallet(row.id);
  return toWallet({ ...row, is_default: input.isDefault });
}

/** Rename and/or correct the balance by hand (e.g. after counting cash). */
export async function updateWallet(input: UpdateWalletInput): Promise<void> {
  unwrap(await supabase.from('wallets').update({ name: input.name, balance: input.balance }).eq('id', input.id));
}

/** Its transactions stay, detached from any wallet (ON DELETE SET NULL). */
export async function deleteWallet(id: string): Promise<void> {
  unwrap(await supabase.from('wallets').delete().eq('id', id));
}

export async function setDefaultWallet(id: string): Promise<void> {
  unwrap(await supabase.rpc('set_default_wallet', { p_wallet_id: id }));
}

export async function transferBetweenWallets(input: TransferInput, timeZone: string): Promise<void> {
  unwrap(
    await supabase.rpc('transfer_between_wallets', {
      p_from_wallet_id: input.fromWalletId,
      p_to_wallet_id: input.toWalletId,
      p_amount: input.amount,
      p_date: transactionInstantForDate(input.date, timeZone).toISOString(),
    })
  );
}

/** A wallet can be removed once it is empty and another wallet is the default. */
export function canDeleteWallet(wallet: Wallet): boolean {
  return !wallet.isDefault && wallet.balance === 0;
}
