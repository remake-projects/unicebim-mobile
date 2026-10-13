-- Global audience: per-user currency, time zone and locale.
-- v1 keeps a single currency per user; wallets and amounts are in profiles.currency.

alter table public.profiles
  add column if not exists currency text not null default 'TRY',
  add column if not exists timezone text not null default 'UTC',
  add column if not exists locale text not null default 'en';

alter table public.profiles drop constraint if exists profiles_currency_iso;
alter table public.profiles
  add constraint profiles_currency_iso check (currency ~ '^[A-Z]{3}$');

alter table public.profiles drop constraint if exists profiles_locale_format;
alter table public.profiles
  add constraint profiles_locale_format check (locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$');

-- Users created by the Turkish web app.
update public.profiles
set timezone = 'Europe/Istanbul', locale = 'tr'
where timezone = 'UTC' and locale = 'en';

create or replace function public.is_valid_timezone(p_tz text)
returns boolean
language sql
stable
set search_path = pg_catalog
as $$
  select exists (select 1 from pg_timezone_names where name = p_tz);
$$;

-- Subscriptions: free-text 'TL' → ISO 4217.
update public.subscriptions set currency = 'TRY' where currency in ('TL', 'tl', '₺');
alter table public.subscriptions alter column currency set default 'TRY';
alter table public.subscriptions drop constraint if exists subscriptions_currency_iso;
alter table public.subscriptions
  add constraint subscriptions_currency_iso check (currency ~ '^[A-Z]{3}$');

-- Signup bootstrap now reads region and localized default wallet names from the
-- metadata the app sends with signUp():
--   { full_name, currency, timezone, locale, wallet_names: ["Nakit", "Banka"] }
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_currency text := upper(coalesce(v_meta->>'currency', ''));
  v_timezone text := coalesce(v_meta->>'timezone', '');
  v_locale text := coalesce(v_meta->>'locale', '');
  v_cash text := left(nullif(trim(v_meta->'wallet_names'->>0), ''), 50);
  v_bank text := left(nullif(trim(v_meta->'wallet_names'->>1), ''), 50);
begin
  insert into public.profiles (id, full_name, currency, timezone, locale)
  values (
    new.id,
    v_meta->>'full_name',
    case when v_currency ~ '^[A-Z]{3}$' then v_currency else 'TRY' end,
    case when public.is_valid_timezone(v_timezone) then v_timezone else 'UTC' end,
    case when v_locale ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then v_locale else 'en' end
  )
  on conflict (id) do nothing;

  if not exists (select 1 from public.wallets where user_id = new.id) then
    insert into public.wallets (user_id, name, balance, is_default)
    values
      (new.id, coalesce(v_cash, 'Cash'), 0, true),
      (new.id, coalesce(v_bank, 'Bank'), 0, false);
  end if;

  return new;
end;
$$;
