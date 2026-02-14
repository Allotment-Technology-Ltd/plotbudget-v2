# Authentication

The app uses **Supabase Auth** with email/password, OAuth (Google, Apple), and magic link (passwordless email). The callback route is `/auth/callback`; redirects after auth use the `redirect_after_auth` cookie when `?redirect=...` is present (e.g. partner invite).

## Enabled providers

| Provider     | Description                    | Feature flag / env                          |
|-------------|--------------------------------|---------------------------------------------|
| Email/password | Sign in and sign up with password | Always on                                   |
| Google      | Continue with Google          | `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true` or PostHog `google-login-enabled` |
| Apple       | Continue with Apple           | `NEXT_PUBLIC_APPLE_LOGIN_ENABLED=true` or PostHog `apple-login-enabled`   |
| Magic link  | Email me a sign-in link       | On by default; set `NEXT_PUBLIC_MAGIC_LINK_ENABLED=false` to hide. PostHog `magic-link-enabled` overrides when set. |

## Environment variables

All auth-related env vars are optional. In **production**, when PostHog is configured, PostHog feature flags override these env vars. In **pre-production** (local, Vercel preview URLs, or `NEXT_PUBLIC_APP_ENV=preview` / `staging`), PostHog is bypassed and env vars are always used so you can enable Google/Apple/magic link without changing PostHog.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED` | When `true`, show "Continue with Google" on login/signup. |
| `NEXT_PUBLIC_APPLE_LOGIN_ENABLED` | When `true`, show "Continue with Apple" on login/signup. |
| `NEXT_PUBLIC_MAGIC_LINK_ENABLED`  | When `true` or unset, show "Email me a sign-in link" on login. Set `false` to hide. |
| `ALLOWED_EMAILS` | Optional comma-separated allowlist; when set, only those emails can sign up. Enforced for email/password signup, magic link (before OTP), and after OAuth/magic-link callback. |

No OAuth client IDs or secrets go in app env; they are configured in the **Supabase Dashboard** (Authentication → Providers).

## Redirect URIs

- **Supabase Dashboard:** Authentication → URL configuration: set **Site URL** to your app origin (e.g. `https://app.plotbudget.com`, `http://localhost:3000`). Add **Redirect URLs** that include `https://your-app-domain/auth/callback` and `http://localhost:3000/auth/callback` for local dev.
- **Google Cloud Console:** OAuth 2.0 Client → Authorized redirect URIs must include `https://<project-ref>.supabase.co/auth/v1/callback` (and the same for localhost if you use Supabase local auth).
- **Apple Developer:** Services ID → Configure → Return URLs must include the same Supabase callback URL as above.

## Callback and errors

- Successful OAuth or magic-link sign-in redirects to `/dashboard` or to the path stored in the `redirect_after_auth` cookie (e.g. after partner invite).
- If the user denies the OAuth consent or the exchange fails, the callback redirects to `/login?error=auth_failed`. The login page shows: "Sign-in was cancelled or failed. Please try again."
- If allowlist is enabled and the OAuth/magic-link email is not allowed, the callback signs the user out and redirects to `/login?error=allowlist` with the invite-list message.

## OAuth profile sync (display name and avatar)

When a user signs in via OAuth (Google or Apple), the callback reads **display name** and **avatar URL** from the provider’s token (Supabase `user_metadata`: e.g. `full_name`, `name`, `picture`/`avatar_url`). These are written to `public.users` (**display_name**, **avatar_url**) only when the existing value is empty, **Avatar is read-only** in the app: it comes solely from the OAuth account; users cannot upload or change it. Magic link and email/password sign-in do not receive profile photos, so they see **initials** instead: first letter of email if no display name, or first letter(s) of display name (e.g. "FL" for "First Last"). Implementation: [`lib/auth/oauth-profile.ts`](apps/web/lib/auth/oauth-profile.ts), [`app/auth/callback/route.ts`](apps/web/app/auth/callback/route.ts), [`lib/utils/avatar-initials.ts`](apps/web/lib/utils/avatar-initials.ts).

## Sign-in methods in Settings

In **Settings → Profile**, users see "You can sign in with: …" when the app can read their linked identities (e.g. Google, Email & password, Apple). This comes from Supabase Auth’s linked identities (`getUserIdentities()` when available), with a fallback to the last-used provider from `app_metadata.provider`. The labels are produced from [`lib/auth/sign-in-methods.ts`](apps/web/lib/auth/sign-in-methods.ts).

## E2E and manual testing

- **Email/password:** Covered by `tests/specs/auth.spec.ts` and `tests/auth.setup.ts` (solo user).
- **Google / Apple / Magic link:** E2E would require a test Supabase project with the providers configured and (for OAuth) either mocked or real consent flows. For now, use **manual testing**: enable the flags, configure the provider in Supabase, and run through sign-in and sign-up on login and signup pages. Verify redirect to `/auth/callback` and then to dashboard or `?redirect=` path.
- **Allowlist:** Set `ALLOWED_EMAILS` to a comma-separated list and confirm signup/magic-link/OAuth are restricted to those emails and the correct error is shown when the email is not allowed.
