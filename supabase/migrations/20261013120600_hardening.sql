-- check_rate_limit was executable by anon, letting anyone grow public.rate_limits.
-- The mobile app talks to Supabase directly and does not use it; keep it for signed-in
-- server-side callers only.
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;
