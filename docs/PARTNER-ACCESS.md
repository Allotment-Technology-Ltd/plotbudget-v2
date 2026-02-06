# Partner access and “next cycle” behaviour

## How the partner accesses the app

When a partner **opens the invite link** (`/partner/join?t=<token>`):

1. They see “Join as partner” with two options: **Create account** or **I already have an account** (log in).
2. After signing up or logging in, they are sent back to the same join page and click **Accept & go to dashboard**.
3. Their account is linked to the household as partner (`partner_user_id`). They are redirected to the dashboard.

From then on, the partner **logs in with their own email/password** (or existing account). They have the same permissions as before (view/edit shared household, mark paid, etc.) but use a real account, so it’s easier to manage and to get back in each paycycle.

---

## Sharing the invite link

The owner can **copy the invite link** from Settings → Household when an invitation is pending. They can share it via WhatsApp, SMS, Instagram, or any app—no need to rely only on email. The link is also sent by email when they send or resend the invitation.

---

## What happens the next cycle / next time they open the app

- The partner signs in with their email and password. They go straight to the dashboard as partner for that household.
- No cookie or magic link is needed; their account is linked to the household.

---

## Who can do what

- **Owner (account holder):** Full access: settings, invite/remove partner, delete account, export data, change password, all seeds/pots/repayments.
- **Partner:** Can view and edit the shared household (seeds, mark paid, blueprint, etc.). They **cannot** delete the account, export data, change household settings (e.g. invite/remove partner, category ratios), or change password. The UI hides “Danger zone” and account deletion for the partner.

---

## Making it clear who is logged in

- In **Settings → Profile** we show either **“Logged in as [owner email]”** (account holder) or the partner’s email (they are signed in as partner).
- In the **header user menu** we show the same identity (owner email or partner email) and **Leave** for the partner (signs them out).
- On **seeds/bills** we show who added a bill and who marked it paid (you vs partner), so it’s clear who made changes.
