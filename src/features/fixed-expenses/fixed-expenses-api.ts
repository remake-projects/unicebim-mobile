import { toNumberOrZero } from '@/core/number';
import type { FixedExpenseInput } from '@/core/schemas/planning';
import { unwrap } from '@/lib/data-error';
import { supabase } from '@/lib/supabase';

/** A recurring monthly cost (rent, phone bill…). Their total feeds the daily limit. */
export type FixedExpense = { id: string; name: string; amount: number };

export async function fetchFixedExpenses(): Promise<FixedExpense[]> {
  const rows = unwrap(
    await supabase.from('fixed_expenses').select('id, name, amount').order('created_at', { ascending: true })
  );
  return rows.map((r) => ({ id: r.id, name: r.name, amount: toNumberOrZero(r.amount) }));
}

export async function createFixedExpense(userId: string, input: FixedExpenseInput): Promise<void> {
  unwrap(await supabase.from('fixed_expenses').insert({ user_id: userId, name: input.name, amount: input.amount }));
}

export async function updateFixedExpense(id: string, input: FixedExpenseInput): Promise<void> {
  unwrap(await supabase.from('fixed_expenses').update({ name: input.name, amount: input.amount }).eq('id', id));
}

export async function deleteFixedExpense(id: string): Promise<void> {
  unwrap(await supabase.from('fixed_expenses').delete().eq('id', id));
}
