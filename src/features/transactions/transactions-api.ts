import type { TransactionType } from '@/core/categories';
import type { CategoryAmount } from '@/core/insights';
import { toNumberOrZero } from '@/core/number';
import type { TransactionInput, UpdateTransactionInput } from '@/core/schemas/transaction';
import type { MonthTotals } from '@/core/stats';
import { transactionInstantForDate, ymdInZone, type MonthRange } from '@/core/time';
import type { Database } from '@/data/database.types';
import { unwrap } from '@/lib/data-error';
import type { TransactionListFilters } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

export type Transaction = {
  id: string;
  walletId: string | null;
  amount: number;
  type: TransactionType;
  category: string;
  /** ISO instant. */
  date: string;
  description: string | null;
  isTransfer: boolean;
  transferGroupId: string | null;
};

export type MonthSummary = { incomeTotal: number; expenseTotal: number; netTotal: number; fixedExpensesPaid: number };

export type PageCursor = { date: string; id: string };
export type TransactionPage = { items: Transaction[]; nextCursor: PageCursor | null };

export const PAGE_SIZE = 30;

const COLUMNS = 'id, wallet_id, amount, type, category, date, description, kind, transfer_group_id';

function toTransaction(row: Pick<TransactionRow, 'id' | 'wallet_id' | 'amount' | 'type' | 'category' | 'date' | 'description' | 'kind' | 'transfer_group_id'>): Transaction {
  return {
    id: row.id,
    walletId: row.wallet_id,
    amount: toNumberOrZero(row.amount),
    type: row.type,
    category: row.category,
    date: row.date,
    description: row.description,
    isTransfer: row.kind === 'transfer',
    transferGroupId: row.transfer_group_id,
  };
}

/** Newest first, keyset-paginated on (date, id) so new rows never shift later pages. */
export async function fetchTransactionsPage(
  filters: TransactionListFilters,
  range: MonthRange,
  cursor: PageCursor | null
): Promise<TransactionPage> {
  let query = supabase
    .from('transactions')
    .select(COLUMNS)
    .gte('date', range.start.toISOString())
    .lt('date', range.end.toISOString());
  if (filters.type) query = query.eq('type', filters.type).eq('kind', 'normal');
  if (filters.walletId) query = query.eq('wallet_id', filters.walletId);
  if (cursor) query = query.or(`date.lt."${cursor.date}",and(date.eq."${cursor.date}",id.lt.${cursor.id})`);

  const rows = unwrap(
    await query.order('date', { ascending: false }).order('id', { ascending: false }).limit(PAGE_SIZE)
  );
  const items = rows.map(toTransaction);
  const last = items.at(-1);
  return { items, nextCursor: items.length === PAGE_SIZE && last ? { date: last.date, id: last.id } : null };
}

export async function fetchRecentTransactions(limit: number): Promise<Transaction[]> {
  const rows = unwrap(
    await supabase
      .from('transactions')
      .select(COLUMNS)
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit)
  );
  return rows.map(toTransaction);
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  return toTransaction(unwrap(await supabase.from('transactions').select(COLUMNS).eq('id', id).single()));
}

export async function createTransaction(userId: string, input: TransactionInput, timeZone: string): Promise<void> {
  unwrap(
    await supabase.from('transactions').insert({
      user_id: userId,
      wallet_id: input.walletId,
      amount: input.amount,
      type: input.type,
      category: input.category,
      date: transactionInstantForDate(input.date, timeZone).toISOString(),
      description: input.description,
    })
  );
}

/** Keeps the original time of day unless the user moved the entry to another day. */
export async function updateTransaction(
  input: UpdateTransactionInput,
  original: Pick<Transaction, 'date'>,
  timeZone: string
): Promise<void> {
  const date =
    ymdInZone(original.date, timeZone) === input.date
      ? original.date
      : transactionInstantForDate(input.date, timeZone).toISOString();
  unwrap(
    await supabase
      .from('transactions')
      .update({
        wallet_id: input.walletId,
        amount: input.amount,
        type: input.type,
        category: input.category,
        date,
        description: input.description,
      })
      .eq('id', input.id)
  );
}

/** Transfers are removed as a pair (both legs) by the delete_transfer RPC. */
export async function deleteTransaction(tx: Pick<Transaction, 'id' | 'transferGroupId'>): Promise<void> {
  if (tx.transferGroupId) {
    unwrap(await supabase.rpc('delete_transfer', { p_transfer_group_id: tx.transferGroupId }));
  } else {
    unwrap(await supabase.from('transactions').delete().eq('id', tx.id));
  }
}

/** Income/expense totals of a month (transfers excluded), optionally for one wallet. */
export async function fetchMonthSummary(range: MonthRange, walletId: string | null): Promise<MonthSummary> {
  const rows = unwrap(
    await supabase.rpc('get_monthly_summary', {
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
      p_wallet_id: walletId ?? undefined,
    })
  );
  const row = rows[0];
  return {
    incomeTotal: toNumberOrZero(row?.income_total),
    expenseTotal: toNumberOrZero(row?.expense_total),
    netTotal: toNumberOrZero(row?.net_total),
    fixedExpensesPaid: toNumberOrZero(row?.fixed_expenses_paid),
  };
}

export async function fetchExpenseCategoryTotals(range: MonthRange): Promise<CategoryAmount[]> {
  const rows = unwrap(
    await supabase.rpc('get_expense_category_totals', {
      p_start: range.start.toISOString(),
      p_end: range.end.toISOString(),
    })
  );
  return rows.map((r) => ({ category: r.category, amount: toNumberOrZero(r.total) }));
}

export type DateRange = { start: Date; end: Date };

/** Rows per request; PostgREST caps responses at 1000 by default. */
const RANGE_BATCH = 1000;
/** Upper bound for one report / chart, so a huge range cannot hang the app. */
export const RANGE_MAX_ROWS = 10_000;

/**
 * Every income/expense (transfers excluded) in [start, end), oldest first, fetched in batches.
 * Stops at RANGE_MAX_ROWS; `truncated` tells the caller.
 */
export async function fetchTransactionsInRange(
  range: DateRange,
  type: TransactionType | null = null
): Promise<{ items: Transaction[]; truncated: boolean }> {
  const items: Transaction[] = [];
  for (let from = 0; from < RANGE_MAX_ROWS; from += RANGE_BATCH) {
    let query = supabase
      .from('transactions')
      .select(COLUMNS)
      .eq('kind', 'normal')
      .gte('date', range.start.toISOString())
      .lt('date', range.end.toISOString());
    if (type) query = query.eq('type', type);
    const rows = unwrap(
      await query.order('date', { ascending: true }).order('id', { ascending: true }).range(from, from + RANGE_BATCH - 1)
    );
    items.push(...rows.map(toTransaction));
    if (rows.length < RANGE_BATCH) return { items, truncated: false };
  }
  return { items, truncated: true };
}

/** Income/expense of the last `months` months (this month last), in the user's time zone. */
export async function fetchMonthlyTrends(months: number, timeZone: string): Promise<MonthTotals[]> {
  const rows = unwrap(await supabase.rpc('get_monthly_trends', { p_months: months, p_tz: timeZone }));
  return rows.map((r) => ({
    ym: r.month.slice(0, 7),
    income: toNumberOrZero(r.income_total),
    expense: toNumberOrZero(r.expense_total),
  }));
}
