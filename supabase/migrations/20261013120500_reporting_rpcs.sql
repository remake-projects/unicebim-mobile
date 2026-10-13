-- Monthly income/expense for the last N months in one call, bucketed by the user's time zone.
-- Replaces N sequential get_monthly_summary calls (6 round-trips per stats screen).
create or replace function public.get_monthly_trends(
  p_months integer,
  p_tz text
)
returns table (
  month date,
  income_total numeric,
  expense_total numeric
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_months integer := least(greatest(coalesce(p_months, 6), 1), 24);
  v_current date;
begin
  if not public.is_valid_timezone(p_tz) then
    raise exception 'invalid time zone' using errcode = '22023';
  end if;
  v_current := date_trunc('month', now() at time zone p_tz)::date;

  return query
  with months as (
    select (v_current - make_interval(months => g))::date as month
    from generate_series(v_months - 1, 0, -1) g
  ),
  totals as (
    select
      date_trunc('month', t.date at time zone p_tz)::date as month,
      sum(t.amount) filter (where t.type::text = 'income') as income,
      sum(t.amount) filter (where t.type::text = 'expense') as expense
    from public.transactions t
    where t.user_id = auth.uid()
      and t.kind = 'normal'
      and t.date >= ((v_current - make_interval(months => v_months - 1))::timestamp at time zone p_tz)
    group by 1
  )
  select m.month, coalesce(tt.income, 0), coalesce(tt.expense, 0)
  from months m
  left join totals tt on tt.month = m.month
  order by m.month;
end;
$$;

revoke all on function public.get_monthly_trends(integer, text) from public, anon;
grant execute on function public.get_monthly_trends(integer, text) to authenticated;
