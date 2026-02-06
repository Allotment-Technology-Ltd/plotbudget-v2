# Resend email setup (partner invites)

Partner invite emails are sent via [Resend](https://resend.com). Follow these steps for each environment where you want emails to work (local, Vercel Preview, production).

---

## 1. Get your API key

1. Go to [resend.com](https://resend.com) and sign in.
2. Open **API Keys**: click your profile/avatar (top right) → **API Keys**, or go to [resend.com/api-keys](https://resend.com/api-keys).
3. Click **Create API Key**.
4. Give it a name (e.g. `PlotBudget local`, `PlotBudget production`).
5. Choose permission: **Sending access** is enough.
6. Click **Add**. **Copy the key** (it starts with `re_`) and store it somewhere safe — you won’t see it again.

---

## 2. (Optional) Set your “from” address

By default the app can use Resend’s test address. To send from your own domain (e.g. `hello@plotbudget.com`):

1. In Resend: **Domains** → **Add Domain**.
2. Add your domain (e.g. `plotbudget.com`) and add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider.
3. Wait until the domain shows as verified.
4. You’ll use this in the env var below as: `RESEND_FROM_EMAIL=PLOT <hello@plotbudget.com>` (name and email in angle brackets).

If you skip this, the app will use Resend’s default “from” when `RESEND_FROM_EMAIL` is not set (fine for testing).

---

## 3. Local development (`apps/web/.env.local`)

Add (or update) these lines in `apps/web/.env.local`:

```env
# Resend – partner invite emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=PLOT <hello@yourdomain.com>
```

- Replace `re_xxx...` with the API key you copied.
- If you didn’t set up a domain, you can omit `RESEND_FROM_EMAIL` for now (Resend will use their default).
- Restart your dev server after changing `.env.local`.

---

## 4. Vercel (Preview and Production)

1. Open your project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add:

   | Name                 | Value                    | Environments      |
   |----------------------|--------------------------|-------------------|
   | `RESEND_API_KEY`     | `re_xxxxxxxxxxxxxxxx…`   | Preview, Production |
   | `RESEND_FROM_EMAIL`  | `PLOT <hello@yourdomain.com>` | Preview, Production (optional) |

3. For **Production** only, ensure the app URL is set:
   - `NEXT_PUBLIC_APP_URL` = `https://app.plotbudget.com` (or your real app URL).

4. Save. New deployments will pick up the variables; no need to redeploy just for env changes unless you want to trigger a new build.

**Tip:** You can use one API key for both Preview and Production, or create separate keys (e.g. “PlotBudget preview” and “PlotBudget production”) if you want to separate usage in Resend’s dashboard.

---

## 5. Check that it works

- **Local:** In the app, go to Settings → Household, invite a partner with an email you can access. You should get the invite email and the link should go to `http://localhost:3000/partner/join?t=...`.
- **Preview/Production:** Same flow; the link should use your preview or production URL.

If the invite fails, the UI will show an error (e.g. “RESEND_API_KEY is not set” or the message from Resend). Check Resend’s **Logs** for delivery and bounce details.

---

## Quick reference

| Variable             | Required | Example / note                                      |
|----------------------|----------|-----------------------------------------------------|
| `RESEND_API_KEY`     | Yes      | `re_xxxxxxxxxxxxxxxxxxxxxxxx`                       |
| `RESEND_FROM_EMAIL`  | No       | `PLOT <hello@plotbudget.com>`; omit to use default  |
| `RESEND_REPLY_TO`    | No       | `hello@plotbudget.com`; where replies go (e.g. your Google inbox) |

No Supabase email or SMTP configuration is needed for partner invites; everything goes through Resend.

---

## Using your own address (e.g. hello@plotbudget.com with Google)

**Sending:** Resend sends the email; it does *not* use your Google account to send. To have emails *show* as from `hello@plotbudget.com`:

1. In Resend, add and verify the domain **plotbudget.com** (DNS records Resend provides).
2. Set `RESEND_FROM_EMAIL=PLOT <hello@plotbudget.com>` in your env. Resend will then send with that “From” address.

**Replies:** When someone replies, the reply goes to whatever mailbox receives mail for that address. If `hello@plotbudget.com` is your Google (Workspace) inbox, replies land there automatically. Optionally set `RESEND_REPLY_TO=hello@plotbudget.com` so the “Reply-To” header explicitly points there.

**Who does what:**

- **Resend** – Sends the email (API call from your app). You only need the API key and a verified domain to send as hello@plotbudget.com.
- **Vercel** – Just runs the app and holds env vars (`RESEND_API_KEY`, etc.). It does not send or receive email.
- **Supabase** – Not used for partner invites. Those are sent by the app via Resend. (Supabase Auth has its own email settings for password reset etc., which are separate.)
- **Google** – Where you *receive* mail for hello@plotbudget.com. No special link to Resend or Vercel; replies go to Google because that’s where your domain’s mail is hosted (MX records).
