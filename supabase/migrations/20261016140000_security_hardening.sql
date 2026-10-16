-- Findings of the Supabase security advisor (2026-10-16).
--
-- 1. check_rate_limit is not used by the app (Supabase Auth limits sign-in and e-mails), yet any
--    signed-in user could call it with arbitrary keys and grow public.rate_limits.
-- 2. Trigger functions that run as SECURITY DEFINER were still EXECUTE-able through
--    /rest/v1/rpc. Postgres refuses to run them outside a trigger, but the grant serves no purpose.
-- 3. Three updated_at / paid_at trigger functions had no fixed search_path.

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.sync_monthly_fixed_expenses() from public, anon, authenticated;

alter function public.update_upcoming_payments_updated_at() set search_path = public;
alter function public.set_upcoming_payment_paid_at() set search_path = public;
alter function public.update_subscriptions_updated_at() set search_path = public;
