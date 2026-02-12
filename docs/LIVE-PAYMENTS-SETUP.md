# Live Payments Setup (Polar + PWYL)

This checklist mirrors the sandbox steps that worked and adapts them for production.

## 1) Create Production PWYL Product (Polar)
- Log in to https://polar.sh (production)
- Create Product:
  - Name: PLOT Premium (Pay What You Like)
  - Type: Subscription
  - Billing: Monthly
  - Currency: GBP (critical)
  - Pricing model: **Pay what you want**
  - Minimum: £0.00
  - Suggested: optional (e.g., £3.00)
- Save and copy the Product ID → `POLAR_PWYL_BASE_PRODUCT_ID`

## 2) Configure Production Env Vars (Vercel/hosting)
Set in production environment (not committed):
```
NEXT_PUBLIC_PRICING_ENABLED=true
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false

POLAR_ACCESS_TOKEN=polar_pat_prod_...
POLAR_WEBHOOK_SECRET=polar_whs_prod_...
POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}
POLAR_PWYL_BASE_PRODUCT_ID=<prod_pwyl_product_id>

# Legacy fixed products (for existing subscribers, keep as-is)
POLAR_PREMIUM_PRODUCT_ID=<existing_prod_id>
POLAR_PREMIUM_ANNUAL_PRODUCT_ID=<existing_prod_annual_id>
```

## 3) Update Polar Email Sender (Production)
- Polar Dashboard → Settings → Emails
- From: `PLOT <hello@app.plotbudget.com>`
- Reply-To: `hello@plotbudget.com`
- Verify domain `app.plotbudget.com` and add DNS records if prompted.

## 4) Webhook (Production)
- In Polar: create a webhook pointing to `https://app.plotbudget.com/api/webhooks/polar`
- Secret → `POLAR_WEBHOOK_SECRET`
- Events: `subscription.created`, `subscription.updated`, `checkout.created` (optional)

## 5) App Config / Flags
- Pricing page shows PWYL by default when `NEXT_PUBLIC_PWYL_PRICING_ENABLED=true` and `NEXT_PUBLIC_PRICING_ENABLED=true`.
- No client presets needed; Polar shows amount selector on checkout.

## 6) Test in Production (real card)
1. Go to https://app.plotbudget.com/pricing
2. Click “Start Premium”
3. On Polar checkout, choose an amount (e.g., £2.00)
4. Pay with a real card
5. Confirm redirect back to app and subscription active (Settings → Subscription)

## 7) Data & UX Notes
- £0 flow: users can select £0 on Polar; webhook will store the amount. (You may choose to hide £0 in production by setting a minimum > £0, but current setup allows £0.)
- Amount selection happens on Polar’s checkout page (native PWYL).
- Settings tab shows PWYL amount and provides “Change Amount” (links to Polar portal) and “Manage Subscription.”

## 8) Emails (Resend or Polar)
- Use production sender: `PLOT <hello@app.plotbudget.com>`
- Templates ready in `/apps/web/emails/`: PWYL welcome, trial milestone, ending soon, ended/action required, grace reminder.
- Ensure your email pipeline (Resend or Polar) is wired to send on relevant lifecycle events.

## 9) Legal Pages
- Privacy and Terms updated with PWYL/payment processing sections (sandbox and prod share same static pages). Deploy to production.

## 10) Rollout Checklist
- [ ] Env vars set in production
- [ ] Polar product created (GBP, PWYL) and ID applied
- [ ] Webhook configured with prod URL + secret
- [ ] Emails sender verified (Polar + Resend)
- [ ] Test live payment succeeds and subscription appears active (see docs/PWYL-TEST-PLAN.md for automation)
- [ ] Pricing link visible in avatar menu; pricing page reachable
- [ ] Monitor logs for webhook success

## 11) Optional Hardening
- Set minimum contribution above £0 if desired (in Polar product)
- Add Sentry alerting on checkout/webhook errors
- Add analytics event on checkout start/success
