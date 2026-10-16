import type { Option } from '@/components/ui/segmented-control';
import { useFormatMoney } from '@/features/profile/use-region';
import type { Wallet } from './wallets-api';

/** Wallet choices labelled with their balance ("Cash · ₺120"). */
export function useWalletOptions(wallets: readonly Wallet[]): Option<string>[] {
  const format = useFormatMoney();
  return wallets.map((w) => ({ value: w.id, label: `${w.name} · ${format(w.balance)}` }));
}
