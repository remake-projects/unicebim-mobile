import { toNumberOrZero } from '@/core/number';
import { unwrap } from '@/lib/data-error';
import { supabase } from '@/lib/supabase';

/** Amounts of all unpaid upcoming payments (overdue ones are still owed). */
export async function fetchUnpaidPaymentAmounts(): Promise<number[]> {
  const rows = unwrap(await supabase.from('upcoming_payments').select('amount').eq('is_paid', false));
  return rows.map((r) => toNumberOrZero(r.amount));
}
