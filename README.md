# UniCebim (mobil)

Öğrenciler ve gençler için bütçe ve harcama takibi — iOS ve Android uygulaması.
Expo (React Native) + Expo Router + Supabase.

> Bu repo, Next.js web uygulamasının mobile port edilmiş halidir. Analiz, kararlar ve yol haritası:
> [`docs/mobil-port-analizi.md`](docs/mobil-port-analizi.md). Eski web kodu referans için
> `legacy-web/` altında (ve `web-baseline` etiketinde) duruyor; build/test kapsamı dışında.

## Yapı

```
src/
  app/          Expo Router ekranları (dosya = ekran); (auth) oturumsuz, (app) oturumlu grup (tab'lar + modal formlar)
  core/         Platformdan bağımsız iş mantığı (kategoriler, para, saat dilimi, şemalar, hesaplamalar) — testli
  features/     Özellik bazlı API modülleri, TanStack Query hook'ları ve bileşenler (auth, profile, wallets, transactions, dashboard)
  components/   UI bileşenleri (components/ui: form ve ekran primitifleri)
  i18n/         Türkçe + İngilizce çeviriler (tip kontrollü anahtarlar)
  lib/          Supabase istemcisi, env, cihaz bölgesi, query client + sorgu anahtarları, hata eşleme
  data/         Supabase veritabanı tipleri
supabase/
  migrations/   Versiyonlu SQL migration'ları
  functions/    Edge Functions (delete-account)
  tests/        Migration davranış testleri
```

## Kurulum

```bash
npm install
cp env.example .env.local   # Supabase URL + publishable key
npx expo start              # Expo Go veya development build ile telefonda aç
```

Veritabanı: [`supabase/README.md`](supabase/README.md) — migration'ları uygulama, edge function deploy.

Supabase Auth → URL Configuration → Redirect URLs listesine `unicebim://auth/callback` (ve geliştirme
için Expo Go'nun `exp://…/--/auth/callback` adresi) eklenmeli; e-posta doğrulama ve parola sıfırlama
bağlantıları uygulamaya buradan döner.

## Kontroller

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (eslint-config-expo)
npm test            # core + i18n birim testleri (Vitest)
npm run test:db     # migration'ları geçici lokal Postgres'te test eder (initdb/pg_ctl/psql gerekir)
```

## Lisans

MIT — bkz. [LICENSE](LICENSE).
