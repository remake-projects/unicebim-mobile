-- Multi-step writes as single atomic RPCs (security invoker: RLS still applies).

-- Transfer: two linked legs; balances move via the wallet trigger.
create or replace function public.transfer_between_wallets(
  p_from_wallet_id uuid,
  p_to_wallet_id uuid,
  p_amount numeric,
  p_date timestamptz,
  p_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group uuid := gen_random_uuid();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_from_wallet_id = p_to_wallet_id then
    raise exception 'same wallet' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive' using errcode = '22023';
  end if;

  perform set_config('unicebim.ledger_rpc', 'on', true);

  insert into public.transactions (user_id, wallet_id, amount, type, category, kind, transfer_group_id, date, description)
  values
    (v_user, p_from_wallet_id, p_amount, 'expense', 'transfer', 'transfer', v_group, p_date, nullif(trim(p_description), '')),
    (v_user, p_to_wallet_id, p_amount, 'income', 'transfer', 'transfer', v_group, p_date, nullif(trim(p_description), ''));

  perform set_config('unicebim.ledger_rpc', 'off', true);
  return v_group;
end;
$$;

create or replace function public.delete_transfer(p_transfer_group_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform set_config('unicebim.ledger_rpc', 'on', true);
  -- Delete the income leg first so the source wallet is refunded before the
  -- destination is debited (keeps both balances non-negative when possible).
  delete from public.transactions
  where transfer_group_id = p_transfer_group_id and user_id = auth.uid() and type::text = 'income';
  delete from public.transactions
  where transfer_group_id = p_transfer_group_id and user_id = auth.uid();
  if not found then
    raise exception 'transfer not found' using errcode = 'P0002';
  end if;
  perform set_config('unicebim.ledger_rpc', 'off', true);
end;
$$;

-- Exactly one default wallet; unset then set inside one transaction.
create or replace function public.set_default_wallet(p_wallet_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (select 1 from public.wallets where id = p_wallet_id and user_id = auth.uid()) then
    raise exception 'wallet not found' using errcode = 'P0002';
  end if;
  update public.wallets set is_default = false where user_id = auth.uid() and is_default and id <> p_wallet_id;
  update public.wallets set is_default = true where id = p_wallet_id;
end;
$$;

-- Paying an upcoming payment records the expense and marks it paid together.
alter table public.upcoming_payments
  add column if not exists transaction_id uuid references public.transactions(id) on delete set null;

create or replace function public.mark_payment_paid(
  p_payment_id uuid,
  p_wallet_id uuid,
  p_date timestamptz default now(),
  p_category text default 'bills'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_payment public.upcoming_payments%rowtype;
  v_tx uuid;
begin
  select * into v_payment
  from public.upcoming_payments
  where id = p_payment_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  if v_payment.is_paid then
    raise exception 'payment already paid' using errcode = '22023';
  end if;

  insert into public.transactions (user_id, wallet_id, amount, type, category, date, description)
  values (v_payment.user_id, p_wallet_id, v_payment.amount, 'expense', p_category, p_date, v_payment.name)
  returning id into v_tx;

  update public.upcoming_payments
  set is_paid = true, transaction_id = v_tx
  where id = p_payment_id;

  return v_tx;
end;
$$;

-- Undo: removes the recorded expense (refunding the wallet) and reopens the payment.
create or replace function public.unmark_payment_paid(p_payment_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tx uuid;
begin
  select transaction_id into v_tx
  from public.upcoming_payments
  where id = p_payment_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;

  update public.upcoming_payments set is_paid = false, transaction_id = null where id = p_payment_id;
  if v_tx is not null then
    delete from public.transactions where id = v_tx and user_id = auth.uid();
  end if;
end;
$$;

-- Bank statement import. Rows are JSON objects:
--   { "date": timestamptz, "amount": numeric > 0, "type": "income"|"expense",
--     "category": text, "description": text, "order": int }
-- Lines already imported (same wallet, instant, type, amount, description, order) are skipped.
-- p_final_balance: the bank's balance after the newest line. When given, the wallet is set to it
-- (the statement is the source of truth); otherwise the net of inserted rows is applied.
create or replace function public.import_transactions(
  p_wallet_id uuid,
  p_rows jsonb,
  p_final_balance numeric default null
)
returns table (inserted integer, skipped integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_total integer := jsonb_array_length(p_rows);
  v_inserted integer;
  v_net numeric;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.wallets where id = p_wallet_id and user_id = v_user) then
    raise exception 'wallet not found' using errcode = 'P0002';
  end if;
  if v_total = 0 or v_total > 1000 then
    raise exception 'between 1 and 1000 rows required' using errcode = '22023';
  end if;
  if p_final_balance is not null and p_final_balance < 0 then
    raise exception 'final balance cannot be negative' using errcode = '22023';
  end if;

  perform set_config('unicebim.skip_wallet_balance', 'on', true);

  with rows as (
    select
      (r->>'date')::timestamptz as date,
      (r->>'amount')::numeric as amount,
      (r->>'type')::public.transaction_type as type,
      r->>'category' as category,
      nullif(left(trim(r->>'description'), 500), '') as description,
      coalesce((r->>'order')::integer, 0) as ord
    from jsonb_array_elements(p_rows) r
  ),
  ins as (
    insert into public.transactions (user_id, wallet_id, amount, type, category, date, description, "order", import_hash)
    select
      v_user, p_wallet_id, amount, type, category, date, description, ord,
      md5(concat_ws('|', p_wallet_id, extract(epoch from date), type, amount, coalesce(description, ''), ord))
    from rows
    on conflict (user_id, import_hash) where import_hash is not null do nothing
    returning amount, type
  )
  select count(*), coalesce(sum(case when type::text = 'income' then amount else -amount end), 0)
  into v_inserted, v_net
  from ins;

  perform set_config('unicebim.skip_wallet_balance', 'off', true);

  if p_final_balance is not null then
    update public.wallets set balance = p_final_balance where id = p_wallet_id;
  elsif v_net <> 0 then
    update public.wallets set balance = balance + v_net where id = p_wallet_id;
  end if;

  return query select v_inserted, v_total - v_inserted;
end;
$$;

revoke all on function public.transfer_between_wallets(uuid, uuid, numeric, timestamptz, text) from public, anon;
revoke all on function public.delete_transfer(uuid) from public, anon;
revoke all on function public.set_default_wallet(uuid) from public, anon;
revoke all on function public.mark_payment_paid(uuid, uuid, timestamptz, text) from public, anon;
revoke all on function public.unmark_payment_paid(uuid) from public, anon;
revoke all on function public.import_transactions(uuid, jsonb, numeric) from public, anon;

grant execute on function public.transfer_between_wallets(uuid, uuid, numeric, timestamptz, text) to authenticated;
grant execute on function public.delete_transfer(uuid) to authenticated;
grant execute on function public.set_default_wallet(uuid) to authenticated;
grant execute on function public.mark_payment_paid(uuid, uuid, timestamptz, text) to authenticated;
grant execute on function public.unmark_payment_paid(uuid) to authenticated;
grant execute on function public.import_transactions(uuid, jsonb, numeric) to authenticated;
