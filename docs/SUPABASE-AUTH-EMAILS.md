# Supabase Auth emails via Send Email Hook + Resend

All Supabase Auth and security notification emails (confirm sign up, magic link, reset password, invite, email change, reauthentication, password/email/phone changed, identity linked/unlinked, MFA) are sent through the **Send Email Auth Hook** so they use **Resend** and PLOT branding. Supabase SMTP is not used when the hook is enabled.

## Architecture

- **Supabase Auth** triggers the hook whenever it would send an email (auth or security).
- **Edge Function** `send-resend-email` at `supabase/functions/send-resend-email/` receives the signed payload, verifies it, builds PLOT-branded HTML per action type, and sends via **Resend**.
- **Resend** is the only sender; templates live in the Edge Function (no Supabase dashboard template editing needed for content).

See [Supabase: Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook) and [Custom Auth Emails with Resend](https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend).

## Production (first-time setup)

Use your **production** Supabase project (the one your production app uses for Auth). Resend must have **plotbudget.com** verified; use the same `RESEND_API_KEY` as in Vercel production env.

1. **Link CLI to production** (if not already): `supabase link --project-ref <your-prod-project-ref>` from repo root. Project ref is in the project URL: `https://app.supabase.com/project/<project-ref>`.
2. **Set initial secrets** (you will add `SEND_EMAIL_HOOK_SECRET` in step 5):
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx RESEND_FROM_EMAIL="PLOT <hello@plotbudget.com>" RESEND_REPLY_TO=hello@plotbudget.com SUPABASE_URL=https://<project-ref>.supabase.co
   ```
   Use your real production Resend key and production Supabase URL.
3. **Deploy the function:**
   ```bash
   supabase functions deploy send-resend-email --no-verify-jwt
   ```
   Note the function URL: `https://<project-ref>.supabase.co/functions/v1/send-resend-email`.
4. **Create the Send Email Hook** in [Supabase Dashboard](https://app.supabase.com) → your **production** project → **Authentication** → **Hooks**. Under **Send Email**, click **Create**. Set **URL** to the function URL from step 3. Click **Generate secret** and **copy the value** (e.g. `v1,whsec_...`).
5. **Set the hook secret** so the function can verify requests:
   ```bash
   supabase secrets set SEND_EMAIL_HOOK_SECRET="v1,whsec_xxx"
   ```
   Paste the value you copied. No need to redeploy the function.
6. **Test**: trigger a password reset (or sign up) from the production app and confirm the email is received from hello@plotbudget.com with PLOT branding.

---

## 1. Supabase project secrets

Set these in the Supabase project that hosts Auth (Dashboard → Project Settings → Edge Functions → Secrets, or via CLI):

| Secret | Required | Description |
|--------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend API key (same as app; e.g. `re_xxx`). |
| `SEND_EMAIL_HOOK_SECRET` | Yes | Webhook secret from the Auth Hooks UI (see below). Format may be `v1,whsec_xxx`; the function strips the prefix. |
| `RESEND_FROM_EMAIL` | No | From address, e.g. `PLOT <hello@plotbudget.com>`. Defaults to `PLOT <hello@plotbudget.com>`. |
| `RESEND_REPLY_TO` | No | Reply-To address; defaults to `hello@plotbudget.com`. Replies go to this inbox. |
| `SUPABASE_URL` | Yes | Project URL, e.g. `https://your-project.supabase.co`. Used to build verify links in emails. |

CLI example (from repo root):

```bash
supabase secrets set RESEND_API_KEY=re_xxx SEND_EMAIL_HOOK_SECRET="v1,whsec_xxx" RESEND_FROM_EMAIL="PLOT <hello@plotbudget.com>" SUPABASE_URL=https://your-project.supabase.co
```

## 2. Deploy the Edge Function

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project):

```bash
supabase functions deploy send-resend-email --no-verify-jwt
```

`--no-verify-jwt` is required because the caller is Supabase Auth (server-side), not the browser. Note the function URL, e.g. `https://your-project.supabase.co/functions/v1/send-resend-email`.

## 3. Configure the Send Email Hook in the dashboard

1. In **Supabase Dashboard** → **Authentication** → **Hooks**.
2. Under **Send Email**, click **Create** (or edit existing).
3. **URL:** your function URL, e.g. `https://your-project.supabase.co/functions/v1/send-resend-email`.
4. **HTTP method:** POST (default).
5. **Generate secret:** click to generate; copy the value (e.g. `v1,whsec_...`) and set it as `SEND_EMAIL_HOOK_SECRET` in Edge Function secrets (step 1).
6. Save the hook.

Once the hook is enabled, Supabase stops using SMTP for auth/security emails; the Edge Function handles all of them.

## 4. Security notification toggles

Under **Authentication** → **Email Templates** → **Security** you can enable/disable:

- Password changed  
- Email address changed  
- Phone number changed  
- Identity linked / Identity unlinked  
- MFA method added / MFA method removed  

Only enabled notifications are sent; the hook receives the corresponding payloads and sends PLOT-branded emails via Resend.

## 5. Testing

- Trigger each flow (sign up, magic link, reset password, invite, email change, reauth) and any enabled security actions.
- Confirm emails appear in Resend’s dashboard and in the recipient inbox with correct links and PLOT branding.
- Verify links (e.g. confirm sign up, reset password) complete the auth flow.

## 6. Local development

The Edge Function runs on Supabase’s infrastructure, not locally, so auth emails in local dev use the same hook and Resend as production. Use a Supabase project (e.g. dev) with the hook configured and the same secrets. No `SEND_EMAIL_HOOK_SECRET` or Resend keys are needed in `apps/web/.env.local` for the hook itself; the Next.js app only needs Resend for app-originated emails (partner invite, trial emails). See [RESEND-SETUP.md](RESEND-SETUP.md).

## Quick reference

| Item | Where |
|------|--------|
| Function code | `supabase/functions/send-resend-email/index.ts` and `templates.ts` |
| PLOT branding | Same look as `apps/web/emails` (logo, footer, colours) |
| Secrets | Supabase project → Edge Functions → Secrets |
| Hook config | Supabase Dashboard → Authentication → Hooks → Send Email |
