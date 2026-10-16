-- Behavioural checks for the migrations (see scripts/test-migrations.sh).
\set ON_ERROR_STOP on

create function pg_temp.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'ASSERTION FAILED: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;

-- Expect a statement to fail with a given SQLSTATE.
create function pg_temp.expect_error(stmt text, state text, msg text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'ASSERTION FAILED: % (no error raised)', msg;
exception when others then
  if sqlstate <> state then
    raise exception 'ASSERTION FAILED: % (got % %)', msg, sqlstate, sqlerrm;
  end if;
  raise notice 'ok - %', msg;
end $$;

grant execute on all functions in schema pg_temp to authenticated;

-- ---------------------------------------------------------------- data migrations
select pg_temp.assert(
  (select array_agg(category order by category) = array['bills','family','other','scholarship']
   from transactions where user_id = '33333333-3333-3333-3333-333333333333'),
  'legacy Turkish categories are mapped to ids');
select pg_temp.assert(
  (select currency = 'TRY' from subscriptions where user_id = '33333333-3333-3333-3333-333333333333'),
  'legacy TL subscriptions become TRY');
select pg_temp.assert(
  (select timezone = 'Europe/Istanbul' and locale = 'tr' from profiles where id = '33333333-3333-3333-3333-333333333333'),
  'existing web users get Turkish region defaults');

-- ---------------------------------------------------------------- signup
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@x.io',
   '{"full_name":"Ada","currency":"EUR","timezone":"Europe/Berlin","locale":"de","wallet_names":["Bargeld","Bank"]}'),
  ('22222222-2222-2222-2222-222222222222', 'b@x.io', '{"timezone":"Not/AZone","currency":"x"}');

select pg_temp.assert(
  (select currency = 'EUR' and timezone = 'Europe/Berlin' and locale = 'de' from profiles where id = '11111111-1111-1111-1111-111111111111'),
  'signup stores region from metadata');
select pg_temp.assert(
  (select currency = 'TRY' and timezone = 'UTC' and locale = 'en' from profiles where id = '22222222-2222-2222-2222-222222222222'),
  'invalid region metadata falls back to defaults');
select pg_temp.assert(
  (select array_agg(name order by is_default desc) = array['Bargeld','Bank'] from wallets where user_id = '11111111-1111-1111-1111-111111111111'),
  'default wallets use localized names');
select pg_temp.assert(
  (select array_agg(name order by is_default desc) = array['Cash','Bank'] from wallets where user_id = '22222222-2222-2222-2222-222222222222'),
  'default wallet names fall back to English');

create table public._w as
  select
    (select id from wallets where user_id = '11111111-1111-1111-1111-111111111111' and is_default) as cash,
    (select id from wallets where user_id = '11111111-1111-1111-1111-111111111111' and not is_default) as bank,
    (select id from wallets where user_id = '22222222-2222-2222-2222-222222222222' and is_default) as other_user_wallet;
grant select on public._w to authenticated;

create function pg_temp.bal(p_which text) returns numeric language sql as $$
  select balance from wallets where id = (select case p_which when 'cash' then cash else bank end from public._w)
$$;
grant execute on function pg_temp.bal(text) to authenticated;

-- ---------------------------------------------------------------- act as user A
set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

insert into transactions (user_id, wallet_id, amount, type, category, date)
select auth.uid(), cash, 1000, 'income', 'scholarship', now() from _w;
insert into transactions (user_id, wallet_id, amount, type, category, date)
select auth.uid(), cash, 250, 'expense', 'food', now() from _w;
select pg_temp.assert(pg_temp.bal('cash') = 750, 'insert adjusts the wallet balance');

select pg_temp.expect_error(
  $$insert into transactions (user_id, wallet_id, amount, type, category, date)
    select auth.uid(), cash, 5000, 'expense', 'social', now() from _w$$,
  '23514', 'overdrawing a wallet is rejected');
select pg_temp.assert((select count(*) = 2 from transactions), 'rejected overdraw left no row');

update transactions set amount = 300 where category = 'food';
select pg_temp.assert(pg_temp.bal('cash') = 700, 'amount update re-applies the difference');

select pg_temp.expect_error(
  $$update transactions t set wallet_id = w.bank from _w w where t.category = 'food'$$,
  '23514', 'moving an expense to an empty wallet is rejected');

insert into transactions (user_id, wallet_id, amount, type, category, date)
select auth.uid(), bank, 500, 'income', 'job', now() from _w;
update transactions t set wallet_id = w.bank from _w w where t.category = 'food';
select pg_temp.assert(pg_temp.bal('cash') = 1000 and pg_temp.bal('bank') = 200, 'moving a transaction moves its effect');

delete from transactions where category = 'scholarship';
select pg_temp.assert(pg_temp.bal('cash') = 0, 'delete reverts the effect');

select pg_temp.expect_error(
  $$insert into transactions (user_id, wallet_id, amount, type, category, date)
    select auth.uid(), other_user_wallet, 1, 'income', 'job', now() from _w$$,
  'P0002', 'another user''s wallet cannot be used');

select pg_temp.expect_error(
  $$insert into transactions (user_id, amount, type, category, date) values (auth.uid(), 1, 'expense', 'Beslenme', now())$$,
  '23514', 'legacy category names are rejected');
select pg_temp.expect_error(
  $$insert into transactions (user_id, amount, type, category, date) values (auth.uid(), 1, 'income', 'food', now())$$,
  '23514', 'category must match the type');

-- ---------------------------------------------------------------- transfers
insert into transactions (user_id, wallet_id, amount, type, category, date)
select auth.uid(), cash, 400, 'income', 'family', now() from _w;
create temp table _t as select transfer_between_wallets(cash, bank, 150, now(), 'ATM') as g from public._w;
select pg_temp.assert(pg_temp.bal('cash') = 250 and pg_temp.bal('bank') = 350, 'transfer moves money between wallets');
select pg_temp.assert((select count(*) = 2 from transactions where kind = 'transfer'), 'transfer writes two legs');

select pg_temp.expect_error($$select transfer_between_wallets(cash, bank, 10000, now()) from _w$$, '23514',
  'transfer cannot overdraw the source wallet');
select pg_temp.expect_error($$select transfer_between_wallets(cash, cash, 1, now()) from _w$$, '22023',
  'transfer to the same wallet is rejected');
select pg_temp.expect_error($$delete from transactions where kind = 'transfer' and type = 'income'$$, '42501',
  'a single transfer leg cannot be deleted directly');
select pg_temp.expect_error(
  $$insert into transactions (user_id, amount, type, category, kind, transfer_group_id, date)
    values (auth.uid(), 1, 'income', 'transfer', 'transfer', gen_random_uuid(), now())$$,
  '42501', 'transfer legs cannot be inserted directly');

select pg_temp.assert(
  (select income_total = 900 and expense_total = 300 and fixed_expenses_paid = 0
   from get_monthly_summary(now() - interval '1 day', now() + interval '1 day')),
  'monthly summary ignores transfers');
select pg_temp.assert(
  (select income_total = 500 and expense_total = 300
   from get_monthly_summary(now() - interval '1 day', now() + interval '1 day', (select bank from _w))),
  'monthly summary can be limited to one wallet');
select pg_temp.assert(
  (select array_agg(category) = array['food'] from get_expense_category_totals(now() - interval '1 day', now() + interval '1 day')),
  'category totals ignore transfers');

select delete_transfer(g) from _t;
select pg_temp.assert(pg_temp.bal('cash') = 400 and pg_temp.bal('bank') = 200, 'deleting a transfer restores both wallets');

-- ---------------------------------------------------------------- default wallet
select set_default_wallet(bank) from _w;
select pg_temp.assert(
  (select array_agg(id) = array[(select bank from _w)] from wallets where is_default), 'exactly one default wallet');
select pg_temp.expect_error($$select set_default_wallet(other_user_wallet) from _w$$, 'P0002',
  'another user''s wallet cannot become default');

-- ---------------------------------------------------------------- upcoming payments
insert into upcoming_payments (user_id, name, amount, due_date) values (auth.uid(), 'Yurt', 100, current_date + 3);
select mark_payment_paid((select id from upcoming_payments where name = 'Yurt'), (select cash from _w));
select pg_temp.assert(pg_temp.bal('cash') = 300, 'paying records the expense on the wallet');
select pg_temp.assert(
  (select is_paid and transaction_id is not null from upcoming_payments where name = 'Yurt'), 'payment is marked paid and linked');
select pg_temp.assert(
  (select category = 'bills' and description = 'Yurt' from transactions where id = (select transaction_id from upcoming_payments where name = 'Yurt')),
  'payment expense uses the bills category and the payment name');
select pg_temp.expect_error($$select mark_payment_paid((select id from upcoming_payments where name = 'Yurt'), null)$$, '22023',
  'a payment cannot be paid twice');
select unmark_payment_paid((select id from upcoming_payments where name = 'Yurt'));
select pg_temp.assert(pg_temp.bal('cash') = 400, 'unmarking refunds the wallet');
select pg_temp.assert(
  (select not is_paid and transaction_id is null from upcoming_payments where name = 'Yurt'), 'unmarking reopens the payment');

-- ---------------------------------------------------------------- bank import
create temp table _rows as select jsonb_build_array(
  jsonb_build_object('date', '2026-10-01T09:00:00Z', 'amount', 3000, 'type', 'income', 'category', 'scholarship', 'description', 'KYK', 'order', 0),
  jsonb_build_object('date', '2026-10-01T09:00:00Z', 'amount', 120.5, 'type', 'expense', 'category', 'food', 'description', 'MIGROS', 'order', 1),
  jsonb_build_object('date', '2026-10-01T09:00:00Z', 'amount', 120.5, 'type', 'expense', 'category', 'food', 'description', 'MIGROS', 'order', 1)
) as r;


select pg_temp.assert(
  (select inserted = 2 and skipped = 1 from import_transactions((select bank from _w), (select r from _rows))),
  'import inserts new lines and skips duplicates in the batch');
select pg_temp.assert(pg_temp.bal('bank') = 200 + 3000 - 120.5, 'import applies the net amount once');
select pg_temp.assert(
  (select inserted = 0 and skipped = 3 from import_transactions((select bank from _w), (select r from _rows))),
  're-importing the same statement inserts nothing');
select pg_temp.assert(
  (select inserted = 0 from import_transactions((select bank from _w), (select r from _rows), 999)) and pg_temp.bal('bank') = 999,
  'final balance from the statement overrides the wallet balance');
select pg_temp.expect_error($$select * from import_transactions((select other_user_wallet from _w), (select r from _rows))$$, 'P0002',
  'cannot import into another user''s wallet');

-- ---------------------------------------------------------------- reporting
select pg_temp.assert(
  (select count(*) = 3 and max(month) = date_trunc('month', now() at time zone 'Europe/Berlin')::date
   from get_monthly_trends(3, 'Europe/Berlin')),
  'trends return one row per month ending this month');
select pg_temp.assert(
  (select income_total >= 3900 from get_monthly_trends(1, 'Europe/Berlin')),
  'trends include this month''s income (transfers excluded)');
select pg_temp.expect_error($$select * from get_monthly_trends(3, 'Mars/Base')$$, '22023', 'invalid time zone is rejected');

-- ---------------------------------------------------------------- avatars
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
insert into storage.objects (bucket_id, name) values ('avatars', '11111111-1111-1111-1111-111111111111/1.jpg');
select pg_temp.assert(
  (select count(*) = 1 from storage.objects where bucket_id = 'avatars'), 'a user can upload into their own avatar folder');
select pg_temp.expect_error(
  $$insert into storage.objects (bucket_id, name) values ('avatars', '22222222-2222-2222-2222-222222222222/1.jpg')$$,
  '42501', 'a user cannot upload into another user''s avatar folder');
select pg_temp.expect_error(
  $$insert into storage.objects (bucket_id, name) values ('avatars', 'loose.jpg')$$,
  '42501', 'avatars must live in a user folder');
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select pg_temp.assert((select count(*) = 0 from storage.objects), 'another user cannot see A''s avatar objects');
delete from storage.objects;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
select pg_temp.assert((select count(*) = 1 from storage.objects), 'another user cannot delete A''s avatar');
delete from storage.objects;
select pg_temp.assert((select count(*) = 0 from storage.objects), 'a user can delete their own avatar');

-- ---------------------------------------------------------------- RLS
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
select pg_temp.assert((select count(*) = 0 from transactions), 'another user sees none of A''s transactions');

-- ---------------------------------------------------------------- privileges
reset role;
set role anon;
select pg_temp.expect_error($$select check_rate_limit('k', 1, 60)$$, '42501', 'anon cannot call check_rate_limit');
select pg_temp.expect_error($$select set_default_wallet(gen_random_uuid())$$, '42501', 'anon cannot call ledger RPCs');
reset role;
set role authenticated;
select pg_temp.expect_error($$select check_rate_limit('k', 1, 60)$$, '42501', 'signed-in users cannot call check_rate_limit');
select pg_temp.assert(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute')
  and not has_function_privilege('anon', 'public.sync_monthly_fixed_expenses()', 'execute'),
  'definer trigger functions are not callable over the API');
select pg_temp.assert(
  (select bool_and(proconfig @> array['search_path=public']) from pg_proc
   where proname in ('update_upcoming_payments_updated_at', 'set_upcoming_payment_paid_at', 'update_subscriptions_updated_at')),
  'trigger functions have a fixed search_path');

-- ---------------------------------------------------------------- cascades
reset role;
delete from wallets where id = (select cash from public._w);
select pg_temp.assert(
  (select count(*) = 0 from transactions where wallet_id = (select cash from public._w)), 'deleting a wallet detaches its transactions');
-- A user with income, expenses, a transfer and a paid payment, deleted the way Supabase Auth does it.
insert into auth.users (id, email, raw_user_meta_data) values
  ('44444444-4444-4444-4444-444444444444', 'd@x.io', '{"wallet_names":["Cash","Bank"]}');
set role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);
insert into transactions (user_id, wallet_id, amount, type, category, date)
select '44444444-4444-4444-4444-444444444444', id, 100, 'income', 'job', now() from wallets where is_default;
insert into transactions (user_id, wallet_id, amount, type, category, date)
select '44444444-4444-4444-4444-444444444444', id, 30, 'expense', 'food', now() from wallets where is_default;
select transfer_between_wallets(
  (select id from wallets where is_default), (select id from wallets where not is_default), 20, now());
insert into upcoming_payments (user_id, name, amount, due_date)
values ('44444444-4444-4444-4444-444444444444', 'Rent', 10, current_date);
select mark_payment_paid((select id from upcoming_payments), (select id from wallets where is_default));
reset role;
set role supabase_auth_admin;
delete from auth.users where id = '44444444-4444-4444-4444-444444444444';
reset role;
select pg_temp.assert(
  (select count(*) = 0 from transactions where user_id = '44444444-4444-4444-4444-444444444444')
  and (select count(*) = 0 from wallets where user_id = '44444444-4444-4444-4444-444444444444'),
  'Supabase Auth can delete a user with transactions, transfers and paid payments');

set role supabase_auth_admin;
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
reset role;
select pg_temp.assert(
  (select count(*) = 0 from transactions where user_id = '11111111-1111-1111-1111-111111111111'), 'deleting a user cascades without balance errors');
