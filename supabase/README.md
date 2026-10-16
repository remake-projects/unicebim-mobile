# Supabase

Veritabanı şeması `migrations/` altında, sırayla uygulanan versiyonlu SQL dosyaları olarak tutulur.

| Migration | İçerik |
|---|---|
| `…120000_baseline` | Web uygulamasının şeması (`web-baseline` etiketi). Idempotent. |
| `…120100_profile_region` | Kullanıcı başına para birimi, saat dilimi, dil; kayıt trigger'ı |
| `…120200_transaction_kinds_and_categories` | Dil-bağımsız kategori kimlikleri, transfer türü, import hash |
| `…120300_wallet_balance_trigger` | Cüzdan bakiyesini DB'nin tutması, eksi bakiye reddi |
| `…120400_ledger_rpcs` | Transfer, varsayılan cüzdan, ödeme işaretleme, banka içe aktarma RPC'leri |
| `…120500_reporting_rpcs` | `get_monthly_trends` |
| `…120600_hardening` | `check_rate_limit` anon erişimini kapatma |

## Uygulama

Supabase CLI ile (`brew install supabase/tap/supabase`; uygulanan migration'ları kendisi takip eder):

```bash
supabase link --project-ref pqddrakkvkvfewnmxqzj   # SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD
supabase db push
npm run db:types                                    # src/data/database.types.ts'i canlı şemadan üretir
```

Uygulanmış migration dosyaları değiştirilmez; her şema değişikliği yeni bir dosyadır.

CLI yoksa: dosyaları **isim sırasıyla** SQL Editor'de çalıştırın.

> ⚠️ Baseline'ı (veya eski `docs/supabase.sql`'i) diğer migration'lardan **sonra** tekrar çalıştırmayın:
> içindeki veri düzeltmeleri kategorileri eski Türkçe adlara çevirmeye çalışır ve hata verir.
> Sonraki migration'lar tekrar çalıştırılmaya dayanıklıdır.

> ⚠️ Bu migration'lar `legacy-web/` altındaki web uygulamasıyla uyumsuzdur (bakiyeyi iki kez işler,
> Türkçe kategori yazar). Web'i yeniden yayına almadan önce `docs/mobil-port-analizi.md` §9'u uygulayın.

## Edge Functions

- `functions/delete-account`: oturum açmış kullanıcının avatar dosyalarını ve hesabını siler
  (App Store / Google Play hesap silme zorunluluğu). Deploy: `supabase functions deploy delete-account --use-api` (Docker gerekmez).

## Testler

`scripts/test-migrations.sh` migration'ları geçici bir lokal Postgres'e uygular ve
`tests/ledger.test.sql`'deki davranış testlerini çalıştırır (bakiye trigger'ı, transferler, ödemeler,
içe aktarma, trendler, RLS, yetkiler, kaskad silmeler). Gerekenler: `initdb`, `pg_ctl`, `psql`
(ör. `brew install postgresql@16`).

```bash
npm run test:db
```

## Uygulamanın bilmesi gerekenler

- Yetersiz bakiye: SQLSTATE `23514` (`wallets_balance_check`).
- Başkasının cüzdanı / bulunamayan kayıt: `P0002`.
- Transfer bacakları tabloya doğrudan yazılamaz (`42501`); `transfer_between_wallets` / `delete_transfer` kullanılır.
- Ay sınırları istemcide kullanıcının saat dilimine göre hesaplanıp `p_start` / `p_end` olarak verilir.
