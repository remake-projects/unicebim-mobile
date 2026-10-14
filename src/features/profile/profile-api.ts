import { toFiniteNumber } from '@/core/number';
import type { BudgetSettingsInput } from '@/core/schemas/profile';
import type { Ymd } from '@/core/time';
import type { Database } from '@/data/database.types';
import { unwrap } from '@/lib/data-error';
import { supabase } from '@/lib/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type Profile = {
  id: string;
  fullName: string | null;
  monthlyBudgetGoal: number | null;
  monthlyFixedExpenses: number | null;
  mealPrice: number | null;
  nextIncomeDate: Ymd | null;
  avatarUrl: string | null;
  currency: string;
  timeZone: string;
  locale: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    monthlyBudgetGoal: toFiniteNumber(row.monthly_budget_goal),
    monthlyFixedExpenses: toFiniteNumber(row.monthly_fixed_expenses),
    mealPrice: toFiniteNumber(row.meal_price),
    nextIncomeDate: row.next_income_date,
    avatarUrl: row.avatar_url,
    currency: row.currency,
    timeZone: row.timezone,
    locale: row.locale,
  };
}

export async function fetchProfile(userId: string): Promise<Profile> {
  return toProfile(unwrap(await supabase.from('profiles').select('*').eq('id', userId).single()));
}

export async function updateBudgetSettings(userId: string, input: BudgetSettingsInput): Promise<Profile> {
  const row = unwrap(
    await supabase
      .from('profiles')
      .update({
        monthly_budget_goal: input.monthlyBudgetGoal,
        next_income_date: input.nextIncomeDate,
        meal_price: input.mealPrice,
      })
      .eq('id', userId)
      .select('*')
      .single()
  );
  return toProfile(row);
}
