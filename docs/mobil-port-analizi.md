# UniCebim → Mobil Port Analizi

> Durum: 2026-10-13 · Bu doküman, `unicebim-mobile` reposunun (şu an web uygulamasının birebir kopyası, `main@bbcd95e`) mobil uygulamaya dönüştürülmesi için yapılan kod incelemesinin çıktısıdır. Kod yazılmamıştır; amaç port kararlarını, riskleri ve yol haritasını netleştirmektir.

---

## 0. TL;DR

- Repo bugün **Next.js 16 (App Router) + React 19 + Supabase SSR** web uygulaması. ~28k satır, 98 commit. Mobil koda dair hiçbir şey yok.
- **İyi haber:** Uygulamanın "beyni"nin önemli kısmı saf TypeScript (kategoriler, Zod şemaları, akıllı bakiye, ödeme analizi, kategori tahmini, IBAN, ay aralıkları). Bunlar React Native'e neredeyse dokunmadan taşınır.
- **Asıl iş:** İş mantığının geri kalanı **Next.js Server Action'larında** (`src/app/actions/*`) ve **Server Component sayfalarında** (özellikle `dashboard/page.tsx`) gömülü. Mobil uygulamanın bir Next.js sunucusu yok; bu mantık ya cihaza ya da **Postgres (RPC/trigger)** katmanına taşınmalı.
- **Karar (2026-10-13):** Flutter değerlendirildi, **Expo (React Native)** seçildi (gerekçe [§3.1](#31-çerçeve-kararı-expo-flutter-değil)). Mimari: Expo + Expo Router + Supabase JS'e doğrudan bağlantı (RLS zaten var). Çok adımlı / tutarlılık gerektiren yazma işlemleri (cüzdan bakiyesi, transfer, ödeme işaretleme, toplu içe aktarma) **atomik Postgres RPC/trigger'larına** taşınmalı.
- **Port öncesi düzeltilmesi gereken gerçek hatalar var** (bakiye kayması, transferin istatistikleri kirletmesi, banka içe aktarmada tür tespitinin hiç çalışmaması, mevcut parolanın doğrulanmaması vb.). Bkz. [§5](#5-port-öncesi-bulunan-hatalar-ve-tutarsızlıklar).
- **Hedef kitle global** (öğrenciler/gençler, yalnız Türkiye değil). Yapısal globalleşme şimdi yapılıyor, çeviriler sonraki fazda. Bkz. [§10](#10-globalleşme).
- **Store zorunluluğu:** Uygulama içi **hesap silme** yok — App Store bunu kayıt destekleyen uygulamalar için şart koşuyor.

---

## 1. Mevcut Web Uygulamasının Envanteri

### 1.1 Teknoloji yığını

| Alan | Web'de kullanılan |
|---|---|
| Framework | Next.js 16.0.10 (App Router, Server Components, Server Actions, `proxy.ts`) |
| UI | React 19.2, Tailwind CSS 4, shadcn/ui (Radix primitives), `lucide-react`, `motion` |
| Form | `react-hook-form` + `zod` 4 (`@hookform/resolvers`) |
| State | `zustand` (bağımlılıkta var, pratikte server state Next cache ile yönetiliyor) |
| Backend | Supabase (Postgres + Auth + Storage), `@supabase/ssr` ile cookie tabanlı oturum |
| Grafik | `recharts` |
| Dosya | `xlsx` (SheetJS 0.18.5), `papaparse`, `react-dropzone`, `html-to-image` |
| Bildirim | `sonner` (toast) |
| Tema | `next-themes` (system / light / dark) |
| İzleme | `@sentry/nextjs` (opsiyonel) |
| Test | Vitest + Testing Library + `vitest-axe`, opsiyonel RLS entegrasyon testi |
| CI | Lint + test, dependency audit, secret scan (`.github/workflows`) |

### 1.2 Katmanlar

```
src/
├── app/                  # Next.js route'ları (UI + veri çekme iç içe)
│   ├── (app)/            # Oturum gerektiren sayfalar (Server Components)
│   ├── (auth)/           # login / register
│   ├── auth/             # e-posta doğrulama callback + check-email + confirming
│   ├── actions/          # ★ Server Actions — yazma tarafı iş mantığı burada
│   ├── api/              # REST route'ları: health, profile, transactions, payments
│   └── about|privacy|terms|tools/bill-splitter|page.tsx (landing)
├── features/             # Özellik bazlı UI + saf mantık + Zod şemaları
├── services/             # Supabase okuma/yazma servisleri (server-only) + banka parser'ları
├── lib/                  # Yardımcılar: para, tarih, ay, sayı, supabase client'ları, güvenlik, http
└── components/           # shadcn/ui, navigation, layout, theme, tools
```

Not: `services/*` katmanı yarım kalmış bir refactor; bazı action'lar servisi kullanıyor (`wallets.ts`), çoğu doğrudan `supabase.from(...)` çağırıyor. Sayfalar da çoğunlukla servisleri atlayıp sorguyu kendisi yapıyor (aynı profil sorgusu ~6 yerde tekrar ediyor).

### 1.3 Ekranlar (web route → işlev)

| Web route | İşlev | Veri kaynağı |
|---|---|---|
| `/` | Landing (pazarlama) | statik |
| `/about`, `/privacy`, `/terms` | Kurumsal / yasal sayfalar | statik |
| `/login`, `/register` | Giriş / kayıt | `loginAction`, `registerAction` |
| `/auth/callback` → `/auth/confirming` | E-posta doğrulama (PKCE `code` veya `token_hash`) | route handler |
| `/auth/check-email` | "Mailini kontrol et" + tekrar gönder | `resendConfirmationEmailAction` |
| `/dashboard` | Ana ekran: cüzdan carousel, harcanabilir bakiye, günlük limit, yemekhane endeksi, burs geri sayımı, sosyal skor, özet kartlar, son işlemler, gelecek ödemeler, yaklaşan abonelikler; bütçe hedefi yoksa onboarding | 8 paralel sorgu/RPC + hesaplamalar sayfada |
| `/dashboard/stats` | 6 aylık özet, ortalama, aylık değişim | 6 ardışık `get_monthly_summary` |
| `/dashboard/reports` | 6 grafik (günlük, haftalık kıyas, gelir/gider, net, trend, kategori pastası) | 4 sorgu + 6 ardışık RPC |
| `/dashboard/subscriptions` | Abonelik listesi + ekle/düzenle/sil, aylık toplam | `subscriptions` |
| `/transactions` | `/transactions/list`'e redirect | — |
| `/transactions/list?month=YYYY-MM` | Ay seçici, özet, bütçe ayarı, işlem ekleme formu, banka içe aktarma, sayfalı liste (cursor) | sorgular + `/api/transactions` (sayfalama) |
| `/transactions/stats` | Kategori toplamları + günlük istatistik | RPC + sorgu |
| `/transactions/charts` | Trend + pasta | RPC'ler |
| `/wallets/[id]` | Cüzdan detayı (bu ayın işlemleri, gelir/gider/net) | sorgu |
| `/reports` | Filtreli detaylı rapor oluşturma + JSON/CSV/HTML dışa aktarma | `generateReportAction` |
| `/profile` | Avatar, ad, parola değiştir, bütçe ayarları, sabit giderler, cüzdan yönetimi, tema | birçok action |
| `/tools/bill-splitter` | Hesap bölüştürücü (eşit / kalem kalem, bahşiş, IBAN, PNG fiş) | tamamen istemci |

Navigasyon: masaüstünde dropdown header, mobil web'de **alt tab bar + ortada FAB** (`components/navigation/bottom-nav.tsx`) — mobil uygulamanın navigasyon iskeleti için doğrudan referans alınabilir.

### 1.4 Veri modeli (Supabase — `docs/supabase.sql`)

| Tablo | Önemli alanlar / kurallar |
|---|---|
| `profiles` | `full_name`, `monthly_budget_goal`, `monthly_fixed_expenses` (trigger ile `fixed_expenses` toplamından senkron), `meal_price (>0)`, `next_income_date`, `avatar_url` |
| `wallets` | `name`, `balance numeric CHECK (balance >= 0)`, `is_default` (kullanıcı başına tek default — partial unique index) |
| `transactions` | `amount > 0`, `type enum(income,expense)`, `category` (DB CHECK ile tipe uygun kategori), `date timestamptz`, `wallet_id → wallets ON DELETE SET NULL`, `description ≤ 500`, `"order"` (aynı tarihli içe aktarma sırası) |
| `fixed_expenses` | `name`, `amount > 0` |
| `upcoming_payments` | `name`, `amount`, `due_date date`, `is_paid`, `paid_at` (trigger), `updated_at` (trigger) |
| `subscriptions` | `name`, `amount`, `currency` (default `TL`), `billing_cycle (monthly/yearly)`, `next_renewal_date`, `icon_url`, `is_active` |
| `rate_limits` | DB tabanlı rate limit kovaları (yalnızca SECURITY DEFINER fonksiyon erişir) |

**RPC'ler:** `get_monthly_summary`, `get_transactions_page` (keyset), `get_expense_category_totals`, `get_unpaid_upcoming_payments_total`, `get_upcoming_payments_with_analysis`, `get_monthly_subscriptions_total`, `get_upcoming_subscription_renewals`, `check_rate_limit`.

**Trigger'lar:** `handle_new_user` (kayıtta profil + "Nakit" (default) ve "Banka" cüzdanı oluşturur), `sync_monthly_fixed_expenses`, `upcoming_payments` için `updated_at` / `paid_at`, `subscriptions` için `updated_at`.

**Storage:** `avatars` bucket (public, 5MB, `user_id/` klasör politikası — dashboard'dan elle kurulum).

**RLS:** Tüm kullanıcı tablolarında `auth.uid() = user_id` politikaları mevcut. Bu, mobilin doğrudan Supabase'e bağlanabilmesinin temel dayanağı.

**Kategoriler** (`features/transactions/categories.ts`, DB CHECK ile birebir aynı olmalı):
- Gelir: `KYK/Burs`, `Aile Harçlığı`, `Freelance/Ek İş`, `Diğer`
- Gider: `Sosyal/Keyif`, `Beslenme`, `Ulaşım`, `Sabitler`, `Okul`, `Diğer`

### 1.5 Server Action envanteri (yazma tarafı)

Her action aynı kalıbı izliyor: `enforceSameOriginForServerAction` (CSRF) → Zod parse → `auth.getUser()` → IP+kullanıcı bazlı rate limit → Supabase yazma → `revalidatePath`.

| Dosya | Action'lar | Mobilde ne olmalı |
|---|---|---|
| `actions/auth.ts` | login, register (+ profil upsert), resend confirmation, logout | `supabase.auth.*` doğrudan; e-posta yönlendirmesi deep link'e |
| `actions/transactions.ts` | create / update / delete (her biri **cüzdan bakiyesini elle günceller**), budget goal güncelle, `bulkImportTransactionsAction` (**kullanılmıyor**), `parseBankStatementAction`, `uploadBankStatementAction` | Bakiye mantığı → DB trigger/RPC; parse → cihazda; upload → RPC |
| `actions/wallets.ts` | create / update / delete (bakiye 0 ise), `transferBetweenWalletsAction` | CRUD doğrudan; default değişimi + transfer → RPC |
| `actions/payments.ts` | create / update / delete / markPaid | CRUD doğrudan; "öde + gider oluştur" → tek RPC |
| `actions/subscriptions.ts` | create / update / delete | doğrudan |
| `actions/fixed-expenses.ts` | create / update / delete | doğrudan (toplam zaten trigger'da) |
| `actions/profile.ts` | profil güncelle, avatar yükle (eskiyi sil), parola değiştir | doğrudan + Storage SDK |
| `actions/reports.ts` | `generateReportAction` → `services/report.service.ts` | cihazda hesapla (saf fonksiyona çevir) |

### 1.6 REST API (`src/app/api`, `docs/openapi.yaml`)

`GET /api/health`, `GET|PATCH /api/profile`, `GET|POST /api/transactions` (keyset sayfalama + ay özeti), `GET /api/payments`. Hepsi **cookie** ile kimlik doğruluyor ve same-origin CSRF kontrolü yapıyor → mobil istemci bunları olduğu gibi **kullanamaz** (Bearer token desteği yok). Önerilen mimaride bunlara ihtiyaç kalmıyor.

---

## 2. Neler Olduğu Gibi Taşınır, Neler Yeniden Yazılır

### 2.1 Doğrudan taşınabilir saf mantık (RN'de aynen çalışır)

| Modül | Not |
|---|---|
| `features/transactions/categories.ts` | aynen |
| `features/*/schemas.ts` (transactions, wallets, payments, subscriptions, fixed-expenses, auth) | aynen; para ayrıştırma notu için §6.4 |
| `features/transactions/summary.ts` | aynen |
| `features/dashboard/smart-balance.ts` | aynen (testli) |
| `features/dashboard/expense-breakdown.ts` | `buildConicGradient` web'e özgü (CSS) → at; renk haritasında `Diğer` eksik (§5) |
| `features/payments/payment-analysis.ts` | aynen; tarih/saat dilimi notu (§5) |
| `features/transactions/import/detect-category.ts`, `detect-iban.ts` | aynen |
| `services/bank-parsers/*` (parse kısmı) | `"use server"`, logger ve **içindeki Supabase sorguları** ayıklanırsa saf parser'a dönüşür; `Buffer` yerine `ArrayBuffer/base64` |
| `features/transactions/import/parse-file.ts` | papaparse + xlsx; RN'de çalışır |
| `lib/money.ts`, `lib/number.ts`, `lib/month.ts`, `lib/date.ts`, `lib/supabase/mappers.ts`, `lib/supabase/errors.ts`, `lib/brand-icon.ts` | aynen |
| `lib/supabase/types.ts` | taşınır ama **güncel değil** (`transactions.order` yok) → `supabase gen types` ile yeniden üret |
| Mevcut Vitest testleri (`*.test.ts` saf olanlar) | aynen |

### 2.2 Bileşen içine gömülü mantık — önce saf fonksiyona çıkarılmalı

Bunlar şu an JSX ile iç içe; mobilde tekrar yazmamak için önce `core` modüllerine çıkarılmalı:

| Nerede | Mantık |
|---|---|
| `app/(app)/dashboard/page.tsx` | toplam bakiye, rezerv (ödenmemiş ödemeler), **harcanabilir bakiye**, `totalMoney` seçimi, ortalama günlük gider, ödeme analizi girdisi, onboarding koşulu |
| `features/dashboard/social-score.tsx` | zorunlu / keyfi ayrımı, tehlike modu oranı |
| `features/dashboard/meal-index.tsx` | öğün sayısı + kalan |
| `features/dashboard/income-countdown.tsx` | kalan gün, günlük güvenli limit, durum rengi eşikleri |
| `app/(app)/dashboard/reports/page.tsx`, `stats/page.tsx`, `transactions/{stats,charts}/page.tsx` | günlük/haftalık gruplama, 6 aylık trend, ortalamalar, aylık değişim |
| `services/report.service.ts` | filtre + istatistik + günlük/aylık kırılım (Supabase okuması ile hesaplama ayrılmalı) |
| `components/tools/bill-splitter.tsx` | eşit/kalem bölme + bahşiş hesabı |
| `app/actions/transactions.ts` (`parseBankStatementAction`) | önizleme dönüşümü (tip + kategori tahmini) |

### 2.3 Web'e özgü — yeniden yazılacak veya atılacak

| Parça | Mobil karşılığı |
|---|---|
| Tüm `app/**` sayfaları, `components/ui/*` (shadcn/Radix), `globals.css` | RN ekranları + RN UI kit (§3.4) |
| `proxy.ts`, `lib/supabase/{server,middleware,client}.ts`, `@supabase/ssr` | `@supabase/supabase-js` + güvenli oturum depolama + `AppState` ile auto-refresh |
| `lib/security/csrf.ts`, `server-action.ts` | Gereksiz (cookie yok, origin yok) |
| `lib/security/rate-limit.ts` | İstemci tarafında anlamsız (istemci atlayabilir) → gerekiyorsa RPC içine (§4) |
| `lib/http/*`, `lib/pagination/tx-cursor.ts`, `app/api/*` | Gereksiz; keyset sayfalama doğrudan `get_transactions_page` RPC ile |
| `lib/export/{csv,json}.ts` (Blob + `<a download>`) | Dosya üret → `expo-file-system` + `expo-sharing` |
| `html-to-image` (fiş PNG) | `react-native-view-shot` + `expo-sharing` |
| `react-dropzone` | `expo-document-picker` |
| `localStorage` (IBAN) | AsyncStorage / MMKV |
| `next-themes`, `lib/seo/*`, `robots.ts`, `sitemap.ts`, `structured-data.tsx`, `next/image` | RN `useColorScheme` + tema store; SEO atılır; `expo-image` |
| Landing, About sayfaları | Atılır (store sayfası bu işi görür) |
| Privacy / Terms | Uygulamada web URL'ine link (store zorunluluğu) |
| `instrumentation.ts`, `sentry.*.config.ts` | `@sentry/react-native` |

---

## 3. Hedef Mimari

### 3.1 Çerçeve kararı: Expo (Flutter değil)

**Karar (2026-10-13): Expo (React Native) + Expo Router.** Flutter da değerlendirildi; ikisi de tek kod tabanından iOS + Android çıkarıyor ve bu proje için yeterince olgun. Belirleyici olan, mevcut kodla bağın korunması.

| | Expo (React Native) | Flutter |
|---|---|---|
| Dil | TypeScript (web ile aynı) | Dart (yeni dil) |
| Web kodunun yeniden kullanımı | `core` (kategoriler, zod şemaları, akıllı bakiye, ödeme analizi, kategori tahmini, IBAN, banka parser'ları) ve testleri kopyalanır | Hiçbiri; hepsi Dart'ta baştan yazılır ve test edilir |
| İş kurallarının tek kaynağı | Web ve mobil aynı TS kodunu kullanabilir | Web yaşarsa kurallar iki dilde iki kopya olur, zamanla birbirinden ayrışır |
| Kütüphaneler | zod, react-hook-form, zustand, supabase-js aynen | Muadilleri (`supabase_flutter`, `fl_chart`, `excel` vb.) |
| Ekip bilgisi | React / Tailwind bilgisi doğrudan geçerli | Dart + widget modeli öğrenilmeli |
| Görsel tutarlılık / animasyon | Native bileşenler; Reanimated ile yeterince akıcı | Kendi çizim motoru; her cihazda piksel piksel aynı, animasyonda güçlü |

Flutter şu durumlarda daha mantıklı olurdu: web tamamen bırakılacaksa, ekipte Dart bilen varsa veya animasyon ağırlıklı, çok iddialı bir görsel tasarım hedefleniyorsa. Bu projede bunların hiçbiri öne çıkmıyor.

Not: En büyük işler (§4'teki veritabanı düzeltmeleri ve mobil tasarım) çerçeve seçiminden bağımsız olarak yapılacak.

#### Sade anlatım: Expo ve Expo Router nedir?

- **React Native:** React ile gerçek telefon uygulaması yazmayı sağlayan temel. `<div>` yerine `<View>`, `<p>` yerine `<Text>` kullanılır; ekranda gerçek iOS/Android bileşenleri çıkar.
- **Expo:** React Native'in üstünde bir alet çantası. Kamera, dosya seçme, bildirim, güvenli depolama gibi hazır modüller verir. Telefonda QR kodla anında deneme yapılmasını sağlar. Uygulamayı Xcode/Android Studio ile uğraşmadan bulutta derleyip mağazaya gönderir (EAS). Küçük düzeltmeleri mağaza onayı beklemeden kullanıcıya ulaştırabilir.
- **Expo Router:** Ekranlar arası gezinmeyi yöneten parça. Next.js'teki `app/` klasörüyle aynı fikir: `app/` altındaki her dosya bir ekran olur.
  - `app/(tabs)/index.tsx` → Ana Sayfa sekmesi
  - `app/wallet/[id].tsx` → Cüzdan detayı
  - Alt sekme çubuğunu, geri tuşunu ve ekran geçişlerini kendisi halleder.
  - E-postadaki doğrulama linkinin uygulamayı doğru ekranda açmasını (deep link) da o sağlar.

#### Sade anlatım: stack katman katman

| Katman | Ne kullanıyoruz | Web'deki karşılığı |
|---|---|---|
| Ekranlar ve gezinme | Expo Router | Next.js `app/` klasörü |
| Görünüm / stil | NativeWind (Tailwind sınıfları telefonda) | Tailwind + shadcn |
| Hesaplama çekirdeği (`core`) | Web'den kopyalanan saf TypeScript | `features/*` içindeki hesap dosyaları |
| Formlar | react-hook-form + zod | Aynısı |
| Veriye erişim | Supabase JS, doğrudan veritabanına | Server Actions |
| Önbellek / yenileme | TanStack Query | `revalidatePath` |
| Tutarlılık kuralları | Veritabanı içinde (trigger/fonksiyon) | Server action'lardaki elle bakiye hesabı |
| Grafikler | victory-native veya gifted-charts | recharts |
| Derleme ve yayın | EAS Build / Submit | Vercel deploy |

En çok değişen iki fikir:

1. **Aradaki sunucu kalkıyor.** Web'de "tarayıcı → Next sunucusu → veritabanı" zinciri vardı; mobilde "telefon → veritabanı". Kimin hangi veriyi görebileceği zaten veritabanı kurallarıyla (RLS) korunuyor.
2. **Kritik kurallar veritabanına taşınıyor.** Örneğin "işlem eklenince cüzdan bakiyesi değişsin" kuralı. Telefon bu kuralı atlayamaz; web, mobil ve içe aktarma gibi her yol aynı kurala uyar. Bakiye kayması (§5.1) kökten çözülür.

#### Örnek akış: "+" butonuyla gider ekleme

1. Kullanıcı alttaki **+**'ya basar; alttan bir panel açılır: tutar, kategori, kaydet.
2. Form, web'dekiyle **aynı zod kurallarıyla** kontrol edilir (tutar pozitif mi, kategori bu türe uygun mu).
3. Kayıt doğrudan Supabase'e gider.
4. Veritabanı, işlemi kaydederken cüzdan bakiyesini kendisi günceller. İkisi tek hamlede olur: ya ikisi birden gerçekleşir ya hiçbiri.
5. TanStack Query dashboard'un ve işlem listesinin bayatladığını bilir ve onları tazeler. İstenirse kayıt bitmeden yeni işlem listede gösterilir (optimistic update); uygulama anlık hissettirir.
6. "Bugün ne kadar harcayabilirim?" rakamı, web'den kopyalanan aynı hesap fonksiyonuyla yeniden hesaplanır.

### 3.2 Temel karar: mobil nereyle konuşacak?

| Seçenek | Artı | Eksi |
|---|---|---|
| **A. Doğrudan Supabase + RPC/trigger (önerilen)** | Sunucu işletme yok; RLS hazır; offline/optimistic UI kolay; tutarlılık kuralları tek yerde (DB) toplanır ve web de faydalanır | SQL migration yazmak gerekir; rate limit DB'de ele alınmalı |
| B. Next.js API'yi Bearer token destekleyecek şekilde genişlet | Mevcut action mantığı yeniden kullanılır | Mobil, ayakta duran bir Next sunucusuna bağımlı olur; mevcut mantık zaten hatalı/atomik değil; çift bakım |
| C. Supabase Edge Functions | Sunucu tarafı TS korunur | Ek altyapı; çoğu işlem için gereksiz |

**Öneri: A**, sadece iki istisna için Edge Function: **hesap silme** (service role gerekir) ve ileride **push bildirim gönderimi** (zamanlanmış). Banka dökümü ayrıştırma cihazda yapılabilir (veri telefondan çıkmaz — gizlilik açısından da daha iyi).

### 3.3 Repo yapısı

Bu repo web reposunun birebir kopyası (aynı git geçmişi, `package.json` adı hâlâ `unicebim`, `homepage` = `rivalth/unicebim`). İki makul yol:

1. **Önerilen:** Bu repoyu mobil uygulamaya dönüştür. Next.js kodunu kaldır; saf mantığı `src/core/` (veya ileride paylaşmak için `packages/core/`) altında topla; web orijinal repoda yaşamaya devam etsin.
2. Monorepo (`apps/web`, `apps/mobile`, `packages/core`): web de aynı repoda yaşayacaksa ve `core` iki tarafta da kullanılacaksa mantıklı. Workspace/Metro konfigürasyonu ek maliyet getirir.

**Karar (2026-10-13): (1).** Web, orijinal repoda (`rivalth/unicebim`) "her ihtimale karşı" yaşamaya devam ediyor ama **ürünün öncü platformu mobil**. Yeni kurallar ve düzeltmeler önce burada yapılır; gerekirse sonradan web'e aktarılıp web öyle deploy edilir.

Bunun pratik sonuçları:
- `core` platformdan bağımsız kalır (React/RN/Next import'u yok, sadece TS + zod). Web'e aktarım = `core` klasörünü kopyalamak (ileride gerekirse `packages/core` olarak paylaşılan pakete çevrilir).
- Web'e aktarılacak her değişiklik bir listede tutulur ([§9](#9-webe-aktarım-listesi)); böylece "web'e ne taşınmalı" sorusu sonradan kod karşılaştırarak değil listeden cevaplanır.
- Veritabanı stratejisi için §4'teki uyarıya bakın.

Önerilen mobil iskelet:

```
app/                         # Expo Router (dosya tabanlı route)
├── (auth)/login.tsx, register.tsx, check-email.tsx
├── (tabs)/_layout.tsx       # Ana Sayfa · İşlemler · [+] · İstatistik · Profil
│   ├── index.tsx            # dashboard
│   ├── transactions.tsx
│   ├── stats.tsx
│   └── profile.tsx
├── wallet/[id].tsx
├── subscriptions.tsx, payments.tsx, reports.tsx
├── import.tsx, bill-splitter.tsx
├── transaction/new.tsx      # FAB'ın açtığı modal/sheet
└── auth/callback.tsx        # deep link
src/
├── core/                    # saf TS: kategoriler, şemalar, hesaplamalar, parser'lar (testli)
├── data/                    # supabase client + repository fonksiyonları (tip güvenli sorgular)
├── features/<özellik>/      # hooks (TanStack Query) + ekran bileşenleri
├── ui/                      # tasarım sistemi bileşenleri
└── lib/                     # platform yardımcıları (storage, share, notifications)
supabase/migrations/         # SQL migration'lar (docs/supabase.sql'in yerini alacak)
```

### 3.4 Kütüphane eşleştirmesi

| Web | Mobil öneri | Not |
|---|---|---|
| Next.js App Router | **Expo + Expo Router** | dosya tabanlı route, deep link, typed routes |
| Tailwind + shadcn/ui | **NativeWind** + kendi `ui/` bileşenleri | Tailwind sınıf bilgisi korunur |
| Radix Dialog/Sheet/Dropdown | `@gorhom/bottom-sheet`, native `Alert`/ActionSheet | |
| `lucide-react` | `lucide-react-native` | aynı ikon adları (`category-meta.tsx` neredeyse aynen) |
| `motion` | `react-native-reanimated` | |
| `recharts` | `victory-native` (Skia) veya `react-native-gifted-charts` | 6 grafik türü yeniden yazılır |
| `sonner` | `sonner-native` veya `burnt` | |
| `next-themes` | `useColorScheme` + kalıcı tema tercihi | |
| `@supabase/ssr` | `@supabase/supabase-js` + `expo-secure-store` (büyük oturum için şifreli AsyncStorage deseni) | `AppState` değişiminde `startAutoRefresh/stopAutoRefresh` |
| `revalidatePath` / RSC | **TanStack Query** (cache, invalidation, optimistic update, offline persist) | |
| `react-hook-form` + `zod` | aynen | RN `TextInput` ile `Controller` |
| `zustand` | aynen (UI state: seçili ay, tema, filtre) | |
| `react-dropzone` | `expo-document-picker` | |
| `xlsx`, `papaparse` | SheetJS + papaparse (cihazda) | npm'deki `xlsx@0.18.5` bakımsız ve bilinen açıkları var; SheetJS'in resmi dağıtımından güncel sürüm kullanılmalı |
| `html-to-image` | `react-native-view-shot` | |
| Blob download | `expo-file-system` + `expo-sharing` | |
| `next/image` | `expo-image` | unavatar.io logoları için cache |
| `@sentry/nextjs` | `@sentry/react-native` | |
| Vitest | Vitest (core) + `jest-expo` (bileşen) + Maestro (E2E) | |

---

## 4. Backend (Supabase) Değişiklik Listesi

Mobil istemci doğrudan DB'ye yazacağı için, bugün server action'ların "elle" yaptığı tutarlılık işleri DB'ye taşınmalı.

> ⚠️ **Web ile veritabanı uyumu:** Bakiye trigger'ı (B1) eklendiği anda bugünkü web'in elle bakiye güncelleyen kodu (`actions/transactions.ts`) bakiyeyi **iki kez** uygular; transfer modeli (B3) de bugünkü web transfer kodunu bozar.
>
> **Karar (2026-10-13):** Web canlıda değil, kullanıcısı yok. Bu yüzden:
> - Web **dondurulur**: mobil port süresince deploy edilmez, mevcut Supabase projesine bağlı olarak çalıştırılmaz.
> - Migration'lar **doğrudan mevcut Supabase projesine** uygulanabilir; ayrı staging projesine gerek yok. Korunacak gerçek kullanıcı verisi olmadığı için web'i bozmanın bir bedeli yok.
> - Migration'lar yine de `supabase/migrations/` altında versiyonlu tutulur; web yeniden canlıya alınmadan önce §9'daki aktarım listesi uygulanır.
> - İleride gerçek kullanıcı geldiğinde (mobil yayına çıkınca) ayrı bir dev/staging projesine geçilir; o noktadan sonra production'a doğrudan migration denenmez.

| # | Değişiklik | Neden |
|---|---|---|
| B1 | **Cüzdan bakiyesi trigger'ı**: `transactions` AFTER INSERT/UPDATE/DELETE → ilgili `wallets.balance`'ı atomik `balance = balance ± amount` ile güncelle (eski/yeni cüzdan ve tip değişimini hesaba kat) | Bugün read-modify-write, atomik değil, hata yutuluyor (§5.1). Tüm yollar (manuel, import, transfer) otomatik tutarlı olur |
| B2 | **Negatif bakiye kararı**: `CHECK (balance >= 0)` korunacak mı? Korunacaksa trigger hata fırlatır ve işlem reddedilir; kaldırılacaksa kredi kartı benzeri cüzdanlar mümkün olur | Bugün gider > bakiye olduğunda işlem kaydediliyor ama bakiye güncellenemiyor |
| B3 | **Transfer modeli**: `transactions`'a `kind` (`normal`/`transfer`) + `transfer_group_id` kolonu **veya** ayrı `wallet_transfers` tablosu; `transfer_between_wallets(from, to, amount, date)` RPC'si tek transaction'da | Bugün transfer `Sabitler` gideri + `KYK/Burs` geliri olarak yazılıyor (§5.2) |
| B4 | İstatistik RPC'lerinde (`get_monthly_summary`, `get_expense_category_totals`, `get_transactions_page`) transferleri hariç tut | B3'ün devamı |
| B5 | `set_default_wallet(p_wallet_id)` RPC | "Diğerlerini false yap → bunu true yap" iki ayrı çağrı; arada hata olursa default kalmaz |
| B6 | `mark_payment_paid(p_payment_id, p_wallet_id, p_category, p_date)` RPC: gider işlemini oluştur + ödemeyi işaretle (tek transaction) | Bugün istemci iki ayrı action çağırıyor |
| B7 | `import_transactions(p_wallet_id, p_rows jsonb)` RPC + `transactions.import_hash` (tarih+tutar+açıklama+order) üzerinde kullanıcı bazlı unique index; `ON CONFLICT DO NOTHING` ile tekilleştirme | Bugünkü tekrar kontrolü hatalı (§5.3); bakiye de güncellenmiyor |
| B8 | `get_monthly_trends(p_months int)` RPC (tek sorguda N ay) | Bugün 6 ardışık RPC çağrısı → mobil ağda çok yavaş |
| B9 | (opsiyonel) `get_dashboard(p_start, p_end)` RPC | Dashboard 8 istek atıyor; mobilde tek round-trip ciddi fark yaratır |
| B10 | **Hesap silme** Edge Function (service role ile `auth.admin.deleteUser`; cascade zaten var + avatar dosyalarını sil) | App Store zorunluluğu (§6.6) |
| B11 | Auth → Redirect URLs listesine `unicebim://auth/callback` (ve Expo dev URL'leri) ekle | E-posta doğrulama / parola sıfırlama mobil uygulamaya dönmeli |
| B12 | `check_rate_limit` için `anon` yetkisini kaldır / gözden geçir; gerekiyorsa rate limit'i yazma RPC'lerinin içine al | Doğrudan istemci modelinde istemci tarafı rate limit anlamsız; `anon`'a açık olması tabloyu doldurmaya izin veriyor |
| B13 | `docs/supabase.sql` → versiyonlu `supabase/migrations/*` | Idempotent tek dosya, değişiklik takibini ve geri almayı zorlaştırıyor |
| B14 | `supabase gen types` ile tipleri yeniden üret, CI'da drift kontrolü | `types.ts` şu an elle yazılmış ve eksik |
| B15 | (Faz 5) Push bildirimleri için `device_tokens` tablosu + zamanlanmış Edge Function | Ödeme/abonelik hatırlatıcıları |
| B16 | Kategorileri **dil-bağımsız kimliklere** çevir (`KYK/Burs` → `scholarship` vb.), DB CHECK'lerini güncelle, mevcut veriyi dönüştür | Global hedef; görünen ad i18n'den gelir (§10) |
| B17 | `profiles`'a `currency` (ISO 4217, varsayılan `TRY`), `timezone` (IANA), `locale` kolonları; `subscriptions.currency` `TL` → `TRY` | Global hedef (§10) |
| B18 | "Bugün"e bağlı RPC'ler (`current_date` kullananlar) `p_today date` parametresi alsın; trend RPC'si `p_tz` ile ay kovalasın | DB'nin UTC "bugün"ü kullanıcının bugünü değil |

---

## 5. Port Öncesi Bulunan Hatalar ve Tutarsızlıklar

Bunlar mobilde birebir kopyalanmamalı. Çoğu §4'teki DB değişiklikleriyle kökten çözülüyor.

### 5.1 Cüzdan bakiyesi kayması (yüksek)
`src/app/actions/transactions.ts:129`, `:338` ve delete akışı — bakiye önce okunup uygulamada hesaplanıp geri yazılıyor:
- Atomik değil; eşzamanlı iki işlem birbirinin güncellemesini ezer.
- İşlem insert'i başarılı, bakiye güncellemesi başarısız olursa (ör. `balance >= 0` CHECK) sadece `logger.warn` atılıyor → işlem kayıtlı, bakiye yanlış.
- Update akışında önce işlem güncelleniyor, sonra eski etki geri alınıyor, sonra yenisi uygulanıyor; arada hata = kalıcı kayma.
→ **B1/B2**.

### 5.2 Transfer istatistikleri ve "akıllı bakiye"yi bozuyor (yüksek)
`src/app/actions/wallets.ts:266` ve `:286` — transfer, `Sabitler` kategorisinde gider + `KYK/Burs` kategorisinde gelir olarak yazılıyor:
- Aylık gelir/gider toplamları şişiyor, kategori grafikleri yanlış.
- `get_monthly_summary.fixed_expenses_paid` = `Sabitler` giderleri → transfer, **ödenmiş sabit gider** sayılıyor ve "bugün harcanabilir limit" yanlış hesaplanıyor.
- Transfer işlemleri cüzdan bakiyelerini **güncellemiyor** (normal işlem oluşturma güncelliyor) → iki yol tutarsız.
- Hata durumundaki "rollback" (`:310`) `delete().order().limit(1)` ile yapılıyor; PostgREST'te delete için limit güvenilir değil, yanlış/çoklu satır silebilir.
→ **B3/B4**.

### 5.3 Banka dökümü içe aktarma (yüksek)
- `services/bank-parsers/is-bank-parser.ts:190`, `ziraat-bank-parser.ts:189`: `amount: Math.abs(amount)` → işaret kayboluyor; `detectTransactionType` her zaman pozitif tutar görüyor, dolayısıyla **gelen paralar da gider olarak** işaretleniyor (açıklamada gelir anahtar kelimesi yoksa).
- Tekrar kontrolü (`actions/transactions.ts:867` ve parser'lar içinde): cüzdandaki en eski–en yeni işlem tarih aralığına düşen **her** satır atlanıyor → aralıktaki gerçek yeni işlemler sessizce kayboluyor; aralık dışındaki tekrarlar ise yakalanmıyor.
- Önizlemede parser'a `walletId: "preview"` veriliyor (`:692`) → uuid kolonuna geçersiz değerle iki gereksiz sorgu (hata yutuluyor).
- İçe aktarılan işlemler cüzdan bakiyesini güncellemiyor.
- Parser'ların içinde Supabase sorgusu var → parse ve veri erişimi ayrılmalı.
- `bulkImportTransactionsAction` hiçbir yerden çağrılmıyor (ölü kod).
→ Parser'ı saflaştır, işareti koru (`type` parser'dan gelsin), **B7**.

### 5.4 Parola değiştirme mevcut parolayı doğrulamıyor (güvenlik)
`src/app/actions/profile.ts:17` şema `currentPassword` istiyor ama hiç kontrol edilmiyor; `auth.updateUser({ password })` doğrudan çağrılıyor. Açık oturumu olan herkes parolayı değiştirebilir. Mobilde: önce `signInWithPassword` ile yeniden doğrula veya Supabase'in "secure password change" (reauthentication/nonce) akışını kullan.

### 5.5 `Diğer` gider kategorisi eksik eşlemeler
Son commit (`bbcd95e`) `Diğer`'i gider kategorilerine ekledi ama `features/dashboard/expense-breakdown.ts:13` `Record<ExpenseCategory, string>` renk haritasında `Diğer` anahtarı yok → strict TS'de tip hatası; ayrıca `Diğer` artık "bilinen kategori" olduğu için `OTHER_COLOR` dalına düşmüyor. `social-score.tsx` de `Diğer`'i ne zorunlu ne keyfi sayıyor (bilinçli mi, karar verilmeli). `getExpenseBreakdown`/`buildConicGradient` sadece testlerde kullanılıyor.

### 5.6 Saat dilimi karışıklığı (orta)
- Dashboard ve `smart-balance.ts` **UTC** günü/ayı kullanıyor; `income-countdown.tsx:24-27` ve `payment-analysis.ts` **yerel** gün kullanıyor. Türkiye'de 00:00–03:00 arasında iki hesap farklı "bugün" görüyor.
- Elle girilen tarih `YYYY-MM-DD` → `YYYY-MM-DDT00:00:00Z` olarak saklanıyor; banka importları ise TR saatinden UTC'ye çevrilmiş gerçek saatle. Aynı gün içindeki sıralama tutarsız olabilir.
- `new Date("YYYY-MM-DD")` UTC olarak ayrıştırılıp sonra `setHours(0,0,0,0)` (yerel) uygulanıyor (`payments/schemas.ts`, `payment-analysis.ts`) — negatif UTC ofsetli cihazda bir gün kayar.
- Stats/report sayfalarında UTC ay başlangıcına yerel `setMonth` uygulanıyor.
→ Karar: **iş günü/ayı = kullanıcının saat dilimi** (`profiles.timezone`) ve tüm `core` fonksiyonları `now` + `timeZone` parametresi alır. Tarih-only alanlar (`due_date`, `next_income_date`, `next_renewal_date`) asla `Date`'e çevrilmeden string olarak karşılaştırılsın.

### 5.7 Dashboard hesap mantığı — ürün kararı gerekiyor
`app/(app)/dashboard/page.tsx`:
- "Harcanabilir bakiye" = **bu ayın gelir − gider − ödenmemiş ödemeler**; cüzdan bakiyeleriyle hiç ilişkili değil. Kullanıcı aynı ekranda iki farklı "bakiye" görüyor (carousel'de cüzdan toplamı, kartta aylık net).
- `totalMoney = incomeTotal > 0 ? incomeTotal : monthlyBudgetGoal` (`:302`) → ay içinde tek bir gelir girildiği anda bütçe hedefi tamamen yok sayılıyor.
- Ödeme analizinde `expectedIncomeAmount: null` sabit → "gelirle karşılanabilir" dalı hiç çalışmıyor.
Mobil dashboard'u tasarlamadan önce bu tanımlar netleştirilmeli.

### 5.8 Diğer küçük notlar
- `proxy.ts:65` korumalı route listesinde `/wallets` ve `/tools` yok (layout yine yönlendiriyor; mobilde ilgisiz).
- Para ayrıştırma: `Number(val.replace(",", "."))` yalnızca ilk virgülü değiştiriyor; `1.234,56` gibi TR formatı `NaN` olur (§6.4).
- `get_upcoming_payments_with_analysis` / `get_unpaid_upcoming_payments_total` / abonelik RPC'leri `p_user_id` parametresi alıyor; `security invoker` + RLS sayesinde güvenli ama gereksiz — `auth.uid()` yeterli.
- Ödemeler RPC fallback'i `due_date.gte` ile `or` kurarken RPC'nin "son 30 gün" mantığıyla aynı değil.
- Rapor servisi kategori filtresini DB'de, tutar filtresini bellekte uyguluyor; tüm işlemleri sınırsız çekiyor (2 yıl sınırı var ama satır limiti yok).

---

## 6. Mobile Özgü Konular

### 6.1 Kimlik doğrulama ve oturum
- `supabase-js` istemcisi: `persistSession: true`, `detectSessionInUrl: false`, depolama olarak SecureStore (oturum JSON'u 2KB'ı aşabildiği için şifreli AsyncStorage + SecureStore'da anahtar deseni).
- `AppState` ön plana geçince `auth.startAutoRefresh()`, arka planda `stopAutoRefresh()`.
- Kayıt/doğrulama: `emailRedirectTo: 'unicebim://auth/callback'` → Expo Router'da `auth/callback` ekranı `exchangeCodeForSession` / `verifyOtp` (web'deki `auth/callback/route.ts` mantığı). Universal/App Links ileride.
- `registerAction`'daki istemci tarafı profil upsert'i gereksiz (trigger var).
- Parola sıfırlama akışı web'de de yok → mobilde eklenmeli (`resetPasswordForEmail` + deep link).
- Opsiyonel: biyometrik uygulama kilidi (`expo-local-authentication`) — finans uygulaması için beklenen bir özellik.

### 6.2 Veri katmanı
- TanStack Query anahtar şeması: `['dashboard', ym]`, `['transactions', ym, filters]` (infinite query, `get_transactions_page` cursor'u), `['wallets']`, `['payments']`, `['subscriptions']`, `['profile']`.
- Mutasyonlarda `revalidatePath` yerine ilgili anahtarları invalidate et; işlem ekleme için optimistic update (FAB akışının hızlı hissettirmesi için önemli).
- Offline: v1'de query cache persist + "çevrimdışısın" bandı yeterli; yazma kuyruğu (offline mutation) Faz 5.

### 6.3 Ekran haritası (web → mobil)

| Mobil | Web karşılığı |
|---|---|
| Tab: **Ana Sayfa** | `/dashboard` (+ onboarding) |
| Tab: **İşlemler** | `/transactions/list` (ay seçici, filtre, sonsuz liste, swipe ile sil/düzenle) |
| **FAB (+)** → bottom sheet | `AddTransactionModal` / `QuickAddTransactionDialog` (Tutar → Kategori → Kaydet) |
| Tab: **İstatistik** | `/dashboard/stats` + `/dashboard/reports` + `/transactions/{stats,charts}` (tek ekranda segmentli) |
| Tab: **Profil** | `/profile` (alt ekranlar: Hesap, Bütçe & Sabit Giderler, Cüzdanlar, Görünüm, Güvenlik, Veri, Hesabı Sil) |
| Stack: Cüzdan detayı / Transfer | `/wallets/[id]`, wallets-list transfer dialog |
| Stack: Gelecek Ödemeler | `PaymentsCard` / `PaymentsList` |
| Stack: Abonelikler | `/dashboard/subscriptions` |
| Stack: Rapor oluştur & paylaş | `/reports` |
| Stack: Banka dökümü içe aktar | `ImportModal` (upload → preview → importing → results adımları korunabilir) |
| Stack: Hesap Bölüştürücü | `/tools/bill-splitter` |
| Auth stack | `/login`, `/register`, `/auth/check-email`, `/auth/confirming` |
| — (atılır) | `/`, `/about`; `/privacy`, `/terms` → harici link |

### 6.4 Form ve giriş
- Tutar alanı: `keyboardType="decimal-pad"`; TR klavyede ondalık ayırıcı `,`. `core`'a tek bir `parseMoneyInput` (binlik `.` / ondalık `,` destekli) yazılıp tüm `moneySchema`'lar onu kullanmalı.
- Tarih: native date picker; değer her zaman `YYYY-MM-DD` string olarak forma girer.
- Kategori seçici: büyük ikonlu grid (mevcut `category-picker.tsx` + `use-category-picker.ts` mantığı uyarlanır).

### 6.5 Mobilin getirebileceği yeni değer (Faz 5)
- **Yerel bildirimler**: ödeme vadesi, abonelik yenileme, burs günü (`expo-notifications`; veriler zaten cihazda olduğu için sunucu gerekmeden zamanlanabilir).
- Ana ekran widget'ı: "Bugün harcanabilir: ₺X" (iOS WidgetKit / Android Glance — native modül gerektirir).
- Paylaşım: bill-splitter fişi ve raporları doğrudan WhatsApp vb.'ye paylaşma.
- Banka dökümünü "Paylaş → UniCebim" ile açma (share extension / intent filter).

### 6.6 Store gereksinimleri
- **Uygulama içi hesap silme** (Apple 5.1.1(v); Google Play da hesap silme bağlantısı istiyor) → B10.
- Gizlilik politikası URL'i, App Privacy / Data Safety formları (finansal veri, e-posta, ad, fotoğraf).
- Avatar için fotoğraf kütüphanesi izni metni (`expo-image-picker`), yüklemeden önce yeniden boyutlandırma/sıkıştırma (`expo-image-manipulator`) — web'de 5MB sınırı vardı, mobil fotoğraflar kolayca aşar.
- EAS Build/Submit, ayrı `development` / `preview` / `production` profilleri; ortam değişkenleri `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## 7. Yol Haritası

| Faz | Kapsam | Çıktı |
|---|---|---|
| **0 — Karar & hazırlık** | §8'deki soruların cevaplanması; repo stratejisi; `core` modülünün çıkarılması (saf mantık + mevcut testler + §2.2'deki gömülü hesapların saf fonksiyona çevrilmesi); §5.3–5.6 düzeltmeleri `core`'da | Platformdan bağımsız, testli `core` |
| **1 — Backend** | B1–B9, B11–B14 migration'ları doğrudan mevcut Supabase projesine (web dondurulmuş, §4 uyarısı); RLS entegrasyon testlerinin gerçekten çalıştırılması | Atomik, tutarlı veri katmanı |
| **2 — İskelet** | Expo + Expo Router + NativeWind + TanStack Query + Supabase client; auth akışı (login/register/doğrulama deep link/parola sıfırlama); tema; tab bar + FAB; Sentry | Giriş yapıp boş tab'larda gezilebilen uygulama |
| **3 — Çekirdek** | Dashboard (+ onboarding), işlem ekle/düzenle/sil, işlem listesi (ay, sayfalama, filtre), cüzdanlar + transfer + detay | Günlük kullanım için yeterli MVP |
| **4 — Planlama** | Gelecek ödemeler (+ öde akışı), abonelikler (logo), sabit giderler, bütçe ayarları, profil + avatar + parola + **hesap silme** | Web ile özellik eşitliğinin büyük kısmı |
| **5 — Analiz & araçlar** | İstatistik/grafikler, rapor + paylaş, banka dökümü içe aktarma, hesap bölüştürücü | Tam özellik eşitliği |
| **6 — Mobil artıları** | Yerel bildirimler, biyometrik kilit, offline yazma kuyruğu, widget | Web'den daha iyi deneyim |
| **7 — Yayın** | Store metinleri, gizlilik formları, ikon/splash, EAS submit, beta (TestFlight / internal testing) | Store'da uygulama |

---

## 8. Kararlar

### 8.1 Verilmiş kararlar

| Tarih | Karar | Detay |
|---|---|---|
| 2026-10-13 | Çerçeve: **Expo (React Native) + Expo Router**, Flutter değil | §3.1 |
| 2026-10-13 | **Web yaşamaya devam ediyor**, ama öncü platform mobil; değişiklikler gerekirse sonradan web'e aktarılıp öyle deploy edilir | §3.3, §4 uyarısı, §9 |
| 2026-10-13 | Repo: bu repo saf mobil uygulamaya dönüşür, web orijinal repoda kalır (monorepo yok); `core` platformdan bağımsız tutulur | §3.3 |
| 2026-10-13 | Web canlıda değil, kullanıcı yok → web dondurulur, migration'lar doğrudan mevcut Supabase projesine uygulanır; mobil yayına çıkınca dev/staging ayrımı kurulur | §4 uyarısı |

| 2026-10-13 | Cüzdan bakiyesi **eksiye düşemez** (`CHECK (balance >= 0)` korunur); yetersiz bakiyede işlem net hata ile reddedilir | B1/B2 |
| 2026-10-13 | Transfer: `transactions` içinde `kind = 'transfer'` + ortak `transfer_group_id` ile iki kayıt; istatistiklerde sayılmaz | B3/B4 |
| 2026-10-13 | "Harcanabilir bakiye" = **cüzdan bakiyeleri toplamı − ödenmemiş ödemeler**; aylık gelir−gider istatistik ekranında | §5.7 |
| 2026-10-13 | "Bugün"/"bu ay" **kullanıcının saat dilimine** göre (`profiles.timezone`, ilk açılışta cihazdan alınır); sabit `Europe/Istanbul` değil (global hedef) | §5.6, §10 |
| 2026-10-13 | Platform: **iOS + Android** birlikte | §7 |
| 2026-10-13 | Tasarım: mobil için yeni tasarım, web'in renk ve kart dili korunarak | §6.3 |
| 2026-10-13 | Offline: v1'de tam offline yok; son veriler önbellekten okunabilir | §6.2 |
| 2026-10-13 | "Diğer" gideri sosyal skorda sayılmaz (bugünkü davranış) | §5.5 |
| 2026-10-13 | **Hedef kitle global öğrenciler/gençler.** Yapısal globalleşme (dil-bağımsız kategori kimlikleri, para birimi, saat dilimi, i18n altyapısı) şimdi; çeviriler ve bölgesel içerik ayrı fazda | §10 |

### 8.2 Açık kararlar

1. **Para birimi modeli:** v1'de kullanıcı başına tek para birimi (önerilen). Cüzdan başına farklı para birimi + kur dönüşümü ileride mi?
2. **İlk sürüm dilleri:** Türkçe + İngilizce (önerilen) mi, yalnız Türkçe mi?
3. **Minimum OS sürümleri:** Expo SDK varsayılanları (önerilen) mi, daha eski cihaz desteği mi?

---

## 9. Web'e Aktarım Listesi

Mobil öncü platform olduğu için, web'i sonradan güncel hale getirmek gerektiğinde neyin taşınacağı burada birikir. Her yeni migration veya `core` değişikliği eklenirken bu tabloya bir satır düşülür.

| # | Değişiklik | Web'de etkilenen yer | Web'de yapılacak | Durum |
|---|---|---|---|---|
| W1 | B1 bakiye trigger'ı | `actions/transactions.ts` (create/update/delete içindeki elle bakiye güncelleme) | Elle bakiye kodu kaldırılır | Bekliyor |
| W2 | B3/B4 transfer modeli + `transfer_between_wallets` RPC | `actions/wallets.ts` `transferBetweenWalletsAction` | Action RPC'yi çağırır | Bekliyor |
| W3 | B5 `set_default_wallet` RPC | `services/wallet.service.ts` create/update | RPC'ye geçilir | Bekliyor |
| W4 | B6 `mark_payment_paid` RPC | `features/payments/payments-list.tsx` (iki ayrı action çağrısı) | Tek RPC çağrısı | Bekliyor |
| W5 | B7 `import_transactions` RPC + `import_hash` | `actions/transactions.ts` parse/upload, `services/bank-parsers/*` | `core` parser'ları + RPC | Bekliyor |
| W6 | B8/B9 trend ve dashboard RPC'leri | `dashboard/*`, `transactions/{stats,charts}` sayfaları | Ardışık RPC döngüleri yerine tek çağrı | Bekliyor |
| W7 | B12 rate limit değişikliği | `lib/security/rate-limit.ts` | Yeni modele uyarlanır | Bekliyor |
| W8 | `core` modülü (§5.3–5.6 düzeltmeleri dahil) | `features/*`, `lib/*` saf dosyalar | `core` kopyalanır, eski dosyalar onu import eder | Bekliyor |
| W9 | Parola değiştirmede mevcut parola doğrulaması (§5.4) | `actions/profile.ts` | Aynı düzeltme | Bekliyor |
| W10 | Hesap silme (B10) | `/profile` | "Hesabı sil" butonu → Edge Function | Bekliyor |

**Web'i yeniden canlıya alma sırası:** Veritabanı migration'ları zaten uygulanmış olacağından, web ancak W-satırları uygulandıktan sonra deploy edilir. Aksi halde web bakiyeyi iki kez işler ve eski transfer kodu yeni modelle çakışır.

---

## 10. Globalleşme

Hedef kitle **global öğrenciler ve gençler**. Kullanıcı olmadığı bu dönemde veri modelini değiştirmek ucuz, sonra pahalı (gerçek veri dönüştürme gerekir). Bu yüzden **yapısal** kısımlar şimdi, **içerik** kısımları ayrı fazda.

### 10.1 Şimdi yapılanlar (Faz 0–2 ile birlikte)

| Konu | Bugün (web) | Yeni yapı |
|---|---|---|
| Kategoriler | DB'de Türkçe metin (`KYK/Burs`, `Sabitler`…) | Dil-bağımsız kimlik: gelir `scholarship`, `family`, `job`, `other`; gider `social`, `food`, `transport`, `bills`, `education`, `other`; ek olarak sadece transferlerde `transfer`. Ekranda görünen ad çeviri dosyasından gelir |
| Para birimi | `formatTRY` sabit, abonelikte serbest metin `TL` | `profiles.currency` (ISO 4217, v1'de kullanıcı başına tek para birimi); `formatMoney(amount, currency, locale)` |
| Saat dilimi | UTC ay sınırları + karışık yerel hesap | `profiles.timezone` (IANA, cihazdan); ay/gün sınırları bu dilime göre hesaplanıp RPC'lere `p_start/p_end`, `p_today`, `p_tz` olarak verilir |
| Metinler | Türkçe metinler bileşen ve şemaların içine gömülü | Tüm UI metinleri ve doğrulama mesajları i18n anahtarları üzerinden (`i18next` + `expo-localization`); şemalar mesaj **kodu** döner, çeviriyi UI yapar |
| Sayı/tarih biçimi | `tr-TR` sabit | Cihaz/kullanıcı `locale`'i ile `Intl` |
| Hafta başlangıcı | Pazar (JS `getDay`) karışık | Locale'e göre (v1'de Pazartesi varsayılan) |

### 10.2 Ayrı faza bırakılanlar (yapısal değişiklik gerektirmez)

- İngilizce ve diğer dillerin çeviri dosyaları, store metinleri (Türkçe ilk ve tam dil olarak geliştirilir; altyapı hazır olduğu için dil eklemek dosya eklemekten ibaret).
- Bölgeye özgü özellikler: banka dökümü okuyucuları (şimdilik Ziraat ve İş Bankası; ülke/banka eklemek yeni parser eklemek demek), KYK gibi yerel burs isimleri, yerel ipuçları.
- Çoklu para birimi (cüzdan başına para birimi + kur dönüşümü) — §8.2'deki karara bağlı.
- Bölgesel yasal gereksinimler (GDPR/KVKK metinleri, yaş sınırları).

### 10.3 Neden ayrı faz değil?

Kategori kimlikleri, para birimi ve saat dilimi **veri modelini** etkiliyor; i18n altyapısı da her ekranın yazılış biçimini. Bunları Türkiye odaklı geliştirip sonra eklemek, tüm ekranlara ve mevcut veriye geri dönmek demek. Şimdi kurulduklarında ek maliyetleri küçük; Türkçe tek dil olarak kalsa bile kod global çalışmaya hazır olur.

