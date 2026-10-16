# Release checklist

Everything in the repo that does not need an account is done; the steps below need the owner's
accounts or decisions. Commands run from the repo root.

## 1. Decisions

- [ ] **App identifier.** `app.json` uses `com.unicebim.app` for both stores as a placeholder. It
      cannot change after the first upload; switch it now if you own a domain (e.g. `com.<domain>.unicebim`).
- [ ] **Legal pages.** Fill in and review `privacy-policy.md` and `terms.md`, publish them at public
      URLs (e.g. GitHub Pages, Notion, a simple site) and use those URLs below.
- [ ] **Support e-mail** for the stores and the legal pages.

## 2. Accounts

- [ ] Expo account → `npx eas-cli@latest login`, then `npx eas-cli@latest init` (adds the project id
      to `app.json`; commit it).
- [ ] Apple Developer Program (99 USD / year) and an App Store Connect app record.
- [ ] Google Play Console (25 USD once) and an app record.

## 3. Build environment

`.env.local` is not uploaded to EAS. Create the public variables for each EAS environment
(`development`, `preview`, `production`):

```bash
npx eas-cli@latest env:create --environment production --visibility plaintext \
  --name EXPO_PUBLIC_SUPABASE_URL --value https://pqddrakkvkvfewnmxqzj.supabase.co
# likewise EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, EXPO_PUBLIC_PRIVACY_POLICY_URL, EXPO_PUBLIC_TERMS_URL
```

## 4. Backend before real users

- [ ] Apply pending migrations: `supabase login && supabase db push`.
- [ ] Custom SMTP in Supabase (Auth → SMTP); the built-in sender allows only a few e-mails per hour.
- [ ] Brand the auth e-mail templates (confirm sign-up, reset password) in Turkish and English.
- [ ] Decide on a separate staging project (docs/mobil-port-analizi.md §4).

## 5. Builds

```bash
npx eas-cli@latest build --profile development --platform all   # dev client (Face ID, real device testing)
npx eas-cli@latest build --profile preview --platform android    # installable APK for testers
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform ios      # TestFlight
npx eas-cli@latest submit --platform android  # Play internal testing (first upload may need to be manual)
```

Build numbers are managed remotely by EAS (`appVersionSource: remote`, `autoIncrement`); bump
`version` in `app.json` for each store release.

## 6. Store listing

Texts, screenshot plan and the privacy questionnaire answers: [`store-listing.md`](store-listing.md).
Google Play also requires a public **account deletion** page that explains the in-app deletion.

## 7. Before submitting

- [ ] Test on real iOS and Android devices: sign-up e-mail link, password reset link, Face ID / fingerprint,
      reminders, photo upload, bank import with real statements, account deletion.
- [ ] App Review notes: a demo account with sample data (Apple requires sign-in credentials).
