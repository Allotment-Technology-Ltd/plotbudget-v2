# Partner access and “next cycle” behaviour

## How the partner accesses the app

When a partner **accepts an invite** (on `/partner/join?t=<token>`):

1. They click “Accept & Continue” and a **cookie** (`partner_auth_token`) is set (30-day expiry).
2. They are redirected to the dashboard.

From then on, the partner **does not log in with email/password**. They are recognised by that cookie. The app treats them as “viewing as partner” for that household.

---

## What happens the next cycle / next time they open the app

- **Same browser, within 30 days:** They open the app (e.g. `app.plotbudget.com/dashboard` or your preview URL). The cookie is still there, so they go straight to the dashboard. No need to use the invite link again.
- **New device or after clearing cookies:** The cookie is gone. They must use the **original invite link** again (`/partner/join?t=<token>`). The token does not expire when the invite is accepted; it stays valid so they can re-enter from a new device.
- **After 30 days (cookie expired):** Same as “new device” – use the invite link again.

So “next cycle” is just: they come back to the app in the same browser and keep using it. No extra step unless they’re on a new device or the cookie was cleared.

---

## Who can do what

- **Owner (account holder):** Full access: settings, invite/remove partner, delete account, export data, change password, all seeds/pots/repayments.
- **Partner:** Can view and edit the shared household (seeds, mark paid, blueprint, etc.). They **cannot** delete the account, export data, change household settings (e.g. invite/remove partner, category ratios), or change password. The UI hides “Danger zone” and account deletion for the partner.

---

## Making it clear who is logged in

- In **Settings → Profile** we show either **“Logged in as [owner email]”** (account holder) or **“Viewing as partner ([partner email])”**.
- In the **header user menu** we show the same identity (owner email or “Partner” + partner email).
- On **seeds/bills** we show who added a bill and who marked it paid (you vs partner), so it’s clear who made changes.
