-- Deleting a user failed whenever they had a transaction ("Database error deleting user").
--
-- Supabase Auth deletes auth.users as supabase_auth_admin, which has no rights on public tables.
-- The cascade (auth.users → profiles → transactions) runs as the tables' owner, but the AFTER ROW
-- events it queues fire at the top level, as supabase_auth_admin and at pg_trigger_depth() = 1,
-- so the balance trigger's depth guard did not skip them and its wallet update was denied.
--
-- The balance trigger now runs as its owner and ignores rows of an account that is being deleted
-- (its profile is already gone when the queued events fire). It is still only reachable as a
-- trigger: EXECUTE stays revoked and wallet ownership is checked as before.

create or replace function public.transactions_apply_wallet_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  -- Nested trigger calls (e.g. inside the ledger RPCs' own statements) never adjust balances.
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  if coalesce(current_setting('unicebim.skip_wallet_balance', true), '') = 'on' then
    return null;
  end if;

  -- The account is being deleted: its wallets go too, there is no balance left to keep.
  if not exists (select 1 from public.profiles where id = coalesce(new.user_id, old.user_id)) then
    return null;
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.wallet_id is not null then
    update public.wallets
    set balance = balance - case when old.type::text = 'income' then old.amount else -old.amount end
    where id = old.wallet_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.wallet_id is not null then
    select user_id into v_owner from public.wallets where id = new.wallet_id;
    if v_owner is distinct from new.user_id then
      raise exception 'wallet not found' using errcode = 'P0002';
    end if;

    update public.wallets
    set balance = balance + case when new.type::text = 'income' then new.amount else -new.amount end
    where id = new.wallet_id;
  end if;

  return null;
end;
$$;

revoke all on function public.transactions_apply_wallet_balance() from public, anon, authenticated;
