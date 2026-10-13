-- Wallet balances are maintained by the database: every insert, update or delete of a
-- transaction adjusts its wallet atomically (balance = balance ± amount).
-- Previously the app read the balance, computed a new one and wrote it back, which
-- raced, and silently left the balance wrong when the write failed.
--
-- Balances cannot go negative (wallets_balance_check). A transaction that would overdraw
-- its wallet fails with SQLSTATE 23514, which the app reports as "insufficient balance".
--
-- Internal switches (transaction-local settings, only set by the RPCs in this repo):
--   unicebim.skip_wallet_balance = 'on'  → bank import applies one net adjustment itself
--   unicebim.ledger_rpc          = 'on'  → transfer legs may be written

create or replace function public.transactions_apply_wallet_balance()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid;
begin
  -- Cascades (wallet deleted → wallet_id set null, profile deleted → rows deleted) must not
  -- touch balances: the wallet is going away and partial reversals could trip the check.
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  if coalesce(current_setting('unicebim.skip_wallet_balance', true), '') = 'on' then
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

drop trigger if exists transactions_wallet_balance on public.transactions;
create trigger transactions_wallet_balance
  after insert or delete or update of amount, type, wallet_id on public.transactions
  for each row execute function public.transactions_apply_wallet_balance();

-- Transfer legs are written and removed in pairs by the transfer RPCs only.
create or replace function public.transactions_guard_transfer_legs()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if pg_trigger_depth() > 1 or coalesce(current_setting('unicebim.ledger_rpc', true), '') = 'on' then
    return coalesce(new, old);
  end if;

  if (tg_op in ('UPDATE', 'DELETE') and old.kind = 'transfer')
     or (tg_op in ('INSERT', 'UPDATE') and new.kind = 'transfer') then
    raise exception 'transfers can only be changed with transfer_between_wallets / delete_transfer'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists transactions_guard_transfer_legs on public.transactions;
create trigger transactions_guard_transfer_legs
  before insert or update or delete on public.transactions
  for each row execute function public.transactions_guard_transfer_legs();

-- Ownership must hold for the wallet too, not only for the transaction row.
-- (Insert RLS checked user_id only, so a foreign wallet id could be attached.)
-- Enforced in transactions_apply_wallet_balance above.

revoke all on function public.transactions_apply_wallet_balance() from public, anon, authenticated;
revoke all on function public.transactions_guard_transfer_legs() from public, anon, authenticated;
