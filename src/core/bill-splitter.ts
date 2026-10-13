import { roundMoney } from './number';

export const TIP_OPTIONS = [0, 10, 15, 20] as const;

export type EqualSplit = { subtotal: number; tip: number; total: number; perPerson: number };

export function splitEqually(subtotal: number, people: number, tipPercent: number): EqualSplit {
  const base = Math.max(0, Number.isFinite(subtotal) ? subtotal : 0);
  const tip = base * (tipPercent / 100);
  const total = base + tip;
  return {
    subtotal: roundMoney(base),
    tip: roundMoney(tip),
    total: roundMoney(total),
    perPerson: people > 0 ? roundMoney(total / people) : 0,
  };
}

export type ItemizedShare<T> = T & { amount: number; tip: number; total: number };

/** Each person pays what they ordered plus the same tip percentage on it. */
export function splitItemized<T extends { amount: number }>(
  people: readonly T[],
  tipPercent: number
): { shares: ItemizedShare<T>[]; subtotal: number; tip: number; total: number } {
  const shares = people.map((p) => {
    const amount = Math.max(0, Number.isFinite(p.amount) ? p.amount : 0);
    const tip = amount * (tipPercent / 100);
    return { ...p, amount: roundMoney(amount), tip: roundMoney(tip), total: roundMoney(amount + tip) };
  });
  const subtotal = roundMoney(shares.reduce((s, p) => s + p.amount, 0));
  const tip = roundMoney(shares.reduce((s, p) => s + p.tip, 0));
  return { shares, subtotal, tip, total: roundMoney(subtotal + tip) };
}
