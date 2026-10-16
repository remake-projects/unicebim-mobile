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

async function updateProfile(userId: string, columns: Database['public']['Tables']['profiles']['Update']): Promise<Profile> {
  return toProfile(unwrap(await supabase.from('profiles').update(columns).eq('id', userId).select('*').single()));
}

export function updateBudgetSettings(userId: string, input: BudgetSettingsInput): Promise<Profile> {
  return updateProfile(userId, {
    monthly_budget_goal: input.monthlyBudgetGoal,
    next_income_date: input.nextIncomeDate,
    meal_price: input.mealPrice,
  });
}

export function updateFullName(userId: string, fullName: string): Promise<Profile> {
  return updateProfile(userId, { full_name: fullName });
}

const AVATAR_BUCKET = 'avatars';

/** Storage path ("{user_id}/{file}") of an avatar's public URL, or null for other URLs. */
function avatarPath(url: string): string | null {
  const marker = `/object/public/${AVATAR_BUCKET}/`;
  const index = url.indexOf(marker);
  return index < 0 ? null : decodeURIComponent(url.slice(index + marker.length).split('?')[0] ?? '');
}

/** Best effort: a leftover file is harmless (deleting the account empties the folder). */
async function removeAvatarFile(url: string | null): Promise<void> {
  const path = url && avatarPath(url);
  if (path) await supabase.storage.from(AVATAR_BUCKET).remove([path]);
}

/**
 * Uploads a local JPEG as the new avatar, points the profile at it and removes the previous file.
 * Each upload gets a new name, so cached copies of the old picture are never shown for the new one.
 */
export async function uploadAvatar(userId: string, fileUri: string, previousUrl: string | null): Promise<Profile> {
  const body = await fetch(fileUri).then((r) => r.arrayBuffer());
  const path = `${userId}/${Date.now()}.jpg`;
  const bucket = supabase.storage.from(AVATAR_BUCKET);
  unwrap(await bucket.upload(path, body, { contentType: 'image/jpeg' }));
  let profile: Profile;
  try {
    profile = await updateProfile(userId, { avatar_url: bucket.getPublicUrl(path).data.publicUrl });
  } catch (error) {
    await bucket.remove([path]);
    throw error;
  }
  await removeAvatarFile(previousUrl);
  return profile;
}

export async function removeAvatar(userId: string, previousUrl: string | null): Promise<Profile> {
  const profile = await updateProfile(userId, { avatar_url: null });
  await removeAvatarFile(previousUrl);
  return profile;
}
