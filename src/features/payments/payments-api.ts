import { toNumberOrZero } from '@/core/number';
import type { PaymentInput, PayPaymentInput } from '@/core/schemas/planning';
import { transactionInstantForDate, type Ymd } from '@/core/time';
import type { Database } from '@/data/database.types';
import { unwrap } from '@/lib/data-error';
import { supabase } from '@/lib/supabase';

type PaymentRow = Database['public']['Tables']['upcoming_payments']['Row'];

export type Payment = {
  id: string;
  name: string;
  amount: number;
  dueDate: Ymd;
  isPaid: boolean;
  paidAt: string | null;
};

/** Paid payments stay listed this long, so a mistaken "paid" can still be undone. */
const PAID_VISIBLE_DAYS = 30;

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    name: row.name,
    amount: toNumberOrZero(row.amount),
    dueDate: row.due_date,
    isPaid: row.is_paid,
    paidAt: row.paid_at,
  };
}

/** Every unpaid payment (overdue ones are still owed) plus recently paid ones, by due date. */
export async function fetchPayments(now: Date = new Date()): Promise<Payment[]> {
  const paidSince = new Date(now.getTime() - PAID_VISIBLE_DAYS * 86_400_000).toISOString();
  const rows = unwrap(
    await supabase
      .from('upcoming_payments')
      .select('*')
      .or(`is_paid.eq.false,paid_at.gte."${paidSince}"`)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: true })
  );
  return rows.map(toPayment);
}

export async function createPayment(userId: string, input: PaymentInput): Promise<void> {
  unwrap(
    await supabase
      .from('upcoming_payments')
      .insert({ user_id: userId, name: input.name, amount: input.amount, due_date: input.dueDate })
  );
}

export async function updatePayment(id: string, input: PaymentInput): Promise<void> {
  unwrap(
    await supabase
      .from('upcoming_payments')
      .update({ name: input.name, amount: input.amount, due_date: input.dueDate })
      .eq('id', id)
  );
}

/** The expense recorded when it was paid (if any) stays in the ledger. */
export async function deletePayment(id: string): Promise<void> {
  unwrap(await supabase.from('upcoming_payments').delete().eq('id', id));
}

/** Records the expense in the chosen wallet and marks the payment paid, atomically. */
export async function payPayment(id: string, input: PayPaymentInput, timeZone: string): Promise<void> {
  unwrap(
    await supabase.rpc('mark_payment_paid', {
      p_payment_id: id,
      p_wallet_id: input.walletId,
      p_date: transactionInstantForDate(input.date, timeZone).toISOString(),
    })
  );
}

/** Removes the recorded expense (refunding the wallet) and reopens the payment. */
export async function unpayPayment(id: string): Promise<void> {
  unwrap(await supabase.rpc('unmark_payment_paid', { p_payment_id: id }));
}
