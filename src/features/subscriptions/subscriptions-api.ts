import { brandIconUrl } from '@/core/brand-icon';
import { toNumberOrZero } from '@/core/number';
import type { SubscriptionInput } from '@/core/schemas/planning';
import type { BillingCycle } from '@/core/subscriptions';
import type { Ymd } from '@/core/time';
import type { Database } from '@/data/database.types';
import { unwrap } from '@/lib/data-error';
import { supabase } from '@/lib/supabase';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  /** As stored; may have passed. Use nextRenewalOnOrAfter() for display. */
  nextRenewalDate: Ymd;
  isActive: boolean;
  iconUrl: string | null;
};

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    amount: toNumberOrZero(row.amount),
    billingCycle: row.billing_cycle === 'yearly' ? 'yearly' : 'monthly',
    nextRenewalDate: row.next_renewal_date,
    isActive: row.is_active,
    iconUrl: row.icon_url,
  };
}

function toColumns(input: SubscriptionInput) {
  return {
    name: input.name,
    amount: input.amount,
    billing_cycle: input.billingCycle,
    next_renewal_date: input.nextRenewalDate,
    is_active: input.isActive,
    icon_url: brandIconUrl(input.name),
  };
}

/** Active ones first, then by stored renewal date. */
export async function fetchSubscriptions(): Promise<Subscription[]> {
  const rows = unwrap(
    await supabase
      .from('subscriptions')
      .select('*')
      .order('is_active', { ascending: false })
      .order('next_renewal_date', { ascending: true })
  );
  return rows.map(toSubscription);
}

/** Amounts are in the user's currency (one currency per user in v1). */
export async function createSubscription(userId: string, currency: string, input: SubscriptionInput): Promise<void> {
  unwrap(await supabase.from('subscriptions').insert({ user_id: userId, currency, ...toColumns(input) }));
}

export async function updateSubscription(id: string, input: SubscriptionInput): Promise<void> {
  unwrap(await supabase.from('subscriptions').update(toColumns(input)).eq('id', id));
}

export async function deleteSubscription(id: string): Promise<void> {
  unwrap(await supabase.from('subscriptions').delete().eq('id', id));
}
