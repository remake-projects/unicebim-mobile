# Security review (2026-10-16)

Static review of the mobile app and the live Supabase project, without running the app on a
device. Supabase's security advisor was run before and after the fixes.

## Fixed

| # | Finding | Risk | Fix |
|---|---|---|---|
| S1 | `unicebim://reset-password` opened the "set a new password" screen for any signed-in session, which skips the current-password check of *Change password* | Someone holding an unlocked phone changes the password and takes the account | The screen opens only after a password-recovery link was exchanged on this device (supabase-js `PASSWORD_RECOVERY` event, not a URL parameter); otherwise it redirects to *Change password*. `features/auth/recovery.ts` |
| S2 | Auth redirect allow list contained `exp://**` | A reset link for a victim's address could be sent to an attacker's Expo Go URL (the attacker holds the PKCE verifier) | Allow list is `unicebim://**` only; the app runs in a development build, not Expo Go |
| S3 | Password changes did not require a recent sign-in on the server | A stolen, older session could change the password | Supabase Auth "require reauthentication" on; the app signs in with the current password right before changing it, so normal use is unaffected |
| S4 | Account deletion needed only two taps | Irreversible loss from an unlocked phone | Deletion screen asks for the password (`settings/delete-account`) |
| S5 | App lock was a modal over the running app | Screens opened later (deep links, native modals) could appear above it; balances visible in the app switcher | While locked, the layout renders only the lock screen. iOS blurs the app-switcher preview; Android sets FLAG_SECURE (blank preview, no screenshots) while the lock is on |
| S6 | Reminder notifications showed payment names and amounts on the lock screen | Shoulder surfing even with the app lock on | With the app lock on, the body is generic |
| S7 | CSV export wrote text as-is | A statement description like `=HYPERLINK(…)` runs as a formula when the report is opened in a spreadsheet | Text starting with `= + - @ TAB CR` gets an apostrophe prefix (`core/report.ts`, tested) |
| S8 | Any file was parsed as a statement | A huge file freezes the app | 5 MB limit before parsing |
| S9 | Android auto-backup was on (Expo default) | Session tokens and the cached ledger in the app sandbox were copied to the user's cloud backup | `android.allowBackup: false` |
| S10 | Advisor: `check_rate_limit` callable by any signed-in user; definer trigger functions EXECUTE-able over `/rest/v1/rpc`; three trigger functions without a fixed `search_path` | Table growth; needless attack surface | Migration `20261016140000_security_hardening` (tested locally, applied, smoke test 19/19) |

## Checked, no change

- **Row level security:** every table has owner-only policies, and the local suite tests isolation between users. The advisor reports only `rate_limits` having no policy, which is intended: nothing may read it.
- **Ledger RPCs:** they run as the caller and are covered by RLS, and anon cannot call them (tested).
- **`delete-account` function:**
  - It verifies the caller's token and deletes only that user.
  - Errors reach the client as fixed codes; details go to the server log only.
- **Auth:**
  - Sign-in links use PKCE.
  - The callback accepts only a `code` parameter, so it cannot be used as an open redirect.
  - Reset and resend responses do not reveal whether an address is registered.
  - Refresh tokens are rotated (10 s reuse window).
  - Passwords must be at least 8 characters.
- **Secrets:**
  - The app bundle holds only the publishable key.
  - `.env.local` and `supabase/.temp` are not in git, and gitleaks runs in CI.
  - The app has no `console.log` calls.
- **Brand logos:** the guessed domain is reduced to `[a-z0-9]` before it is put in the unavatar.io URL. The request to that third party is listed in the privacy policy.

## Accepted / open

- **Session storage:** the session and the cached data are stored unencrypted in the app sandbox (SQLite). The OS sandbox and device encryption protect them, and with backups off they do not leave the device. Encrypting them would need a key in the Keychain/Keystore (a SecureStore + AES adapter). It is worth reconsidering if a threat model includes rooted devices.
- **Leaked-password check (HaveIBeenPwned):** available only on Supabase's paid plans.
- **CAPTCHA on sign-up:** not enabled. Supabase Auth's per-IP rate limits apply. Revisit if bot sign-ups appear after launch.
- **Avatars:** the bucket is public, so a picture's URL, which contains the user id, can be opened by anyone who has it.
- **The access token and the database password** pasted into the setup chat should be rotated.
