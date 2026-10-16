import type { ImportRpcRow } from '@/core/bank-import/payload';
import { queryKeys } from '@/lib/query-keys';
import { useInvalidatingMutation } from '@/lib/use-invalidating-mutation';
import { importStatement } from './import-api';

type Variables = { walletId: string; rows: readonly ImportRpcRow[]; finalBalance: number | null };

/** New transactions and a changed wallet balance: every ledger view is stale afterwards. */
export function useImportStatement() {
  return useInvalidatingMutation(
    ({ walletId, rows, finalBalance }: Variables) => importStatement(walletId, rows, finalBalance),
    [queryKeys.ledger, queryKeys.wallets]
  );
}
