import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TransferInput, UpdateWalletInput, WalletInput } from '@/core/schemas/wallet';
import { useUserId } from '@/features/auth/auth-provider';
import { useRegion } from '@/features/profile/use-region';
import { invalidateLedger, queryKeys } from '@/lib/query-keys';
import {
  createWallet,
  deleteWallet,
  fetchWallets,
  setDefaultWallet,
  transferBetweenWallets,
  updateWallet,
  type Wallet,
} from './wallets-api';

export function useWallets() {
  return useQuery({ queryKey: queryKeys.wallets, queryFn: fetchWallets });
}

/** One wallet from the cached list. */
export function useWallet(id: string) {
  return useQuery({
    queryKey: queryKeys.wallets,
    queryFn: fetchWallets,
    select: (wallets: Wallet[]) => wallets.find((w) => w.id === id) ?? null,
  });
}

function useWalletsInvalidation() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: queryKeys.wallets });
}

export function useCreateWallet() {
  const userId = useUserId();
  const onSuccess = useWalletsInvalidation();
  return useMutation({ mutationFn: (input: WalletInput) => createWallet(userId, input), onSuccess });
}

export function useUpdateWallet() {
  const onSuccess = useWalletsInvalidation();
  return useMutation({ mutationFn: (input: UpdateWalletInput) => updateWallet(input), onSuccess });
}

export function useSetDefaultWallet() {
  const onSuccess = useWalletsInvalidation();
  return useMutation({ mutationFn: (id: string) => setDefaultWallet(id), onSuccess });
}

export function useDeleteWallet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWallet(id),
    // Its transactions lose their wallet, so ledger views change too.
    onSuccess: () => invalidateLedger(client),
  });
}

export function useTransfer() {
  const client = useQueryClient();
  const { timeZone } = useRegion();
  return useMutation({
    mutationFn: (input: TransferInput) => transferBetweenWallets(input, timeZone),
    onSuccess: () => invalidateLedger(client),
  });
}
