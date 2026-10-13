-- Web-era data written after the baseline and before the new migrations, to verify the
-- category/currency data migrations. Runs as superuser.
insert into auth.users (id, email, raw_user_meta_data)
values ('33333333-3333-3333-3333-333333333333', 'legacy@x.io', '{"full_name":"Eski"}');

insert into public.transactions (user_id, amount, type, category, date) values
  ('33333333-3333-3333-3333-333333333333', 10, 'income', 'KYK/Burs', now()),
  ('33333333-3333-3333-3333-333333333333', 10, 'income', 'Aile Harçlığı', now()),
  ('33333333-3333-3333-3333-333333333333', 10, 'expense', 'Sabitler', now()),
  ('33333333-3333-3333-3333-333333333333', 10, 'expense', 'Diğer', now());

insert into public.subscriptions (user_id, name, amount, currency, next_renewal_date)
values ('33333333-3333-3333-3333-333333333333', 'Spotify', 60, 'TL', current_date);
