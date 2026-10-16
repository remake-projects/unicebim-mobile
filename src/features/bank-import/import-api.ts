import { chunk, type ImportRpcRow } from '@/core/bank-import/payload';
import type { Json } from '@/data/database.types';
import { unwrap } from '@/lib/data-error';
import { supabase } from '@/lib/supabase';

/** import_transactions accepts at most this many rows per call. */
const RPC_MAX_ROWS = 1000;

export type ImportResult = { inserted: number; skipped: number };

/**
 * Imports statement rows into a wallet; lines imported before are skipped by the RPC.
 * With `finalBalance`, the wallet is set to the bank's balance after the last batch.
 */
export async function importStatement(
  walletId: string,
  rows: readonly ImportRpcRow[],
  finalBalance: number | null
): Promise<ImportResult> {
  const batches = chunk(rows, RPC_MAX_ROWS);
  const result: ImportResult = { inserted: 0, skipped: 0 };
  for (const [index, batch] of batches.entries()) {
    const isLast = index === batches.length - 1;
    const [counts] = unwrap(
      await supabase.rpc('import_transactions', {
        p_wallet_id: walletId,
        p_rows: batch as unknown as Json,
        p_final_balance: isLast && finalBalance != null ? finalBalance : undefined,
      })
    );
    result.inserted += counts?.inserted ?? 0;
    result.skipped += counts?.skipped ?? 0;
  }
  return result;
}
