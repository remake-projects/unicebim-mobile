-- 1) Language-neutral category ids (display names come from the app's i18n).
-- 2) Transfers become a separate transaction kind that statistics ignore.
-- 3) import_hash for idempotent bank statement imports.

alter table public.transactions
  add column if not exists kind text not null default 'normal',
  add column if not exists transfer_group_id uuid,
  add column if not exists import_hash text;

alter table public.transactions drop constraint if exists transactions_kind_valid;
alter table public.transactions
  add constraint transactions_kind_valid check (kind in ('normal', 'transfer'));

alter table public.transactions drop constraint if exists transactions_transfer_group;
alter table public.transactions
  add constraint transactions_transfer_group check ((kind = 'transfer') = (transfer_group_id is not null));

-- Old constraints reference the Turkish names; drop before rewriting the data.
alter table public.transactions drop constraint if exists transactions_category_valid;
alter table public.transactions drop constraint if exists transactions_category_matches_type;

update public.transactions
set category = case category
  when 'KYK/Burs' then 'scholarship'
  when 'Aile Harçlığı' then 'family'
  when 'Freelance/Ek İş' then 'job'
  when 'Sosyal/Keyif' then 'social'
  when 'Beslenme' then 'food'
  when 'Ulaşım' then 'transport'
  when 'Sabitler' then 'bills'
  when 'Okul' then 'education'
  when 'Diğer' then 'other'
  else category
end
where kind = 'normal';

alter table public.transactions
  add constraint transactions_category_matches_type check (
    (kind = 'transfer' and category = 'transfer')
    or (
      kind = 'normal' and (
        (type::text = 'income' and category in ('scholarship', 'family', 'job', 'other'))
        or (type::text = 'expense' and category in ('social', 'food', 'transport', 'bills', 'education', 'other'))
      )
    )
  );

create index if not exists transactions_transfer_group_idx
  on public.transactions (transfer_group_id) where transfer_group_id is not null;

create unique index if not exists transactions_user_import_hash_uidx
  on public.transactions (user_id, import_hash) where import_hash is not null;

-- Statistics RPCs: ignore transfers; fixed costs are the 'bills' category.
-- get_monthly_summary gains an optional wallet filter (wallet detail screen).
drop function if exists public.get_monthly_summary(timestamptz, timestamptz);

create or replace function public.get_monthly_summary(
  p_start timestamptz,
  p_end timestamptz,
  p_wallet_id uuid default null
)
returns table (
  income_total numeric,
  expense_total numeric,
  net_total numeric,
  fixed_expenses_paid numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(amount) filter (where type::text = 'income'), 0),
    coalesce(sum(amount) filter (where type::text = 'expense'), 0),
    coalesce(sum(amount) filter (where type::text = 'income'), 0)
      - coalesce(sum(amount) filter (where type::text = 'expense'), 0),
    coalesce(sum(amount) filter (where type::text = 'expense' and category = 'bills'), 0)
  from public.transactions
  where user_id = auth.uid()
    and kind = 'normal'
    and (p_wallet_id is null or wallet_id = p_wallet_id)
    and date >= p_start
    and date < p_end;
$$;

revoke all on function public.get_monthly_summary(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.get_monthly_summary(timestamptz, timestamptz, uuid) to authenticated;

create or replace function public.get_expense_category_totals(
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  category text,
  total numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  select t.category, coalesce(sum(t.amount), 0) as total
  from public.transactions t
  where t.user_id = auth.uid()
    and t.kind = 'normal'
    and t.type::text = 'expense'
    and t.date >= p_start
    and t.date < p_end
  group by t.category
  order by total desc;
$$;
