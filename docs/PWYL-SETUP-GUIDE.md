# PWYL Pricing - Quick Setup Guide

## 🚀 Getting Started

Follow these steps to enable PWYL pricing in your PLOT installation.

---

## 1️⃣ Verify Polar API Support (CRITICAL FIRST STEP)

Before proceeding, verify Polar supports dynamic price creation:

```bash
# Test with your sandbox token
curl -X POST https://sandbox-api.polar.sh/v1/checkouts \
  -H "Authorization: Bearer YOUR_SANDBOX_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_price_create": {
      "product_id": "test_product_id",
      "type": "recurring",
      "recurring_interval": "month",
      "price_amount": 750,
      "price_currency": "GBP"
    },
    "success_url": "http://localhost:3000/success"
  }'
```

**If successful** → Continue with this guide
**If fails** → See [CRITICAL-POLAR-API-VERIFICATION.md](CRITICAL-POLAR-API-VERIFICATION.md) for fallback plan

---

## 2️⃣ Create PWYL Product in Polar (Sandbox)

1. Log into https://sandbox.polar.sh
2. Go to **Products** → **Create Product**
3. Configure:
   ```
   Name: PLOT Premium (Pay What You Like)
   Description: Support PLOT with your chosen monthly contribution
   Currency: GBP 💷
   Type: Subscription
   Billing: Monthly recurring
   Trial Period: 0 days
   ```
4. Save and copy the **Product ID**

---

## 3️⃣ Configure Environment Variables

Add to `apps/web/.env.local`:

```bash
# Feature Flags
NEXT_PUBLIC_PRICING_ENABLED=true
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false

# PWYL Product
POLAR_PWYL_BASE_PRODUCT_ID=<your_pwyl_product_id>

# Keep existing Polar config
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_WEBHOOK_SECRET=polar_whs_...
POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}

# Keep legacy products (for existing subscribers)
POLAR_PREMIUM_PRODUCT_ID=269c7db2-6026-4662-9261-c904be5012d9
POLAR_PREMIUM_ANNUAL_PRODUCT_ID=879e648f-e969-42e0-807c-7d145c3cb92a
POLAR_PREMIUM_PRICE_ID=269c7db2-6026-4662-9261-c904be5012d9
POLAR_PREMIUM_ANNUAL_PRICE_ID=879e648f-e969-42e0-807c-7d145c3cb92a
```

---

## 4️⃣ Restart Dev Server

```bash
cd apps/web
pnpm dev
```

The pricing page will now show the PWYL matrix by default.

---

## 5️⃣ Test PWYL Flow

### Test £0 (Free Premium)
```
1. Visit: http://localhost:3000/pricing
2. Set slider to £0
3. Click "Start Premium (Free)"
4. Should redirect to /dashboard?upgrade=success
5. Check Settings → Subscription → Should show "Premium (Free) - Community Supporter"
```

### Test Custom Amount (e.g., £7.50)
```
1. Visit: http://localhost:3000/pricing  
2. Set slider to £7.50 (or type in input)
3. Click "Start Premium - £7.50/mo"
4. Should redirect to Polar checkout
5. Complete checkout with test card: 4242 4242 4242 4242
6. Webhook processes → subscription created in DB
7. Redirects to /dashboard?checkout_id=xxx
8. Success toast appears
9. Settings → Subscription shows "Premium - £7.50/month"
```

---

## 6️⃣ Configure Polar Emails

### Set Sender Address

1. Go to Polar Dashboard → **Settings** → **Emails**
2. Set:
   ```
   From Name: PLOT
   From Email: hello@app.plotbudget.com
   Reply-To: hello@plotbudget.com
   ```
3. Verify domain `app.plotbudget.com` (add DNS records if required)

### Customize Email Templates (Optional)

Add PWYL-specific messaging to Polar's automatic emails:
- Subscription Created → Add "Thank you for your £X/month contribution"
- Payment Receipt → Add "You can change your contribution anytime in Settings"

---

## 7️⃣ Environment Variables for Production

When ready for production, set in Vercel/hosting platform:

```bash
# Feature Flags
NEXT_PUBLIC_PRICING_ENABLED=true
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false

# Production Polar Config
POLAR_ACCESS_TOKEN=<production_token>
POLAR_WEBHOOK_SECRET=<production_secret>
POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}
POLAR_PWYL_BASE_PRODUCT_ID=<production_pwyl_product_id>

# Resend (placeholder — use your Resend API key from dashboard)
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=PLOT <hello@app.plotbudget.com>
RESEND_REPLY_TO=hello@plotbudget.com
```

---

## 📋 Implementation Checklist

### Completed ✅
- [x] Feature flags added ([`lib/feature-flags.ts`](../apps/web/lib/feature-flags.ts))
- [x] Amount selector component ([`pricing-amount-selector.tsx`](../apps/web/components/pricing/pricing-amount-selector.tsx))
- [x] PWYL pricing matrix ([`pricing-matrix-pwyl.tsx`](../apps/web/components/pricing/pricing-matrix-pwyl.tsx))
- [x] Pricing page conditional rendering ([`app/pricing/page.tsx`](../apps/web/app/pricing/page.tsx))
- [x] Checkout route with PWYL support ([`app/api/checkout/route.ts`](../apps/web/app/api/checkout/route.ts))
- [x] £0 subscription handling (skips Polar)
- [x] Webhook PWYL metadata handling ([`app/api/webhooks/polar/route.ts`](../apps/web/app/api/webhooks/polar/route.ts))
- [x] Subscription tab PWYL display ([`components/settings/subscription-tab.tsx`](../apps/web/components/settings/subscription-tab.tsx))

### Next Steps (In Order)

1. **Verify Polar API** ⚠️ BLOCKER
   - Test custom price creation (see [CRITICAL-POLAR-API-VERIFICATION.md](CRITICAL-POLAR-API-VERIFICATION.md))
   - Document result
   - Adjust implementation if needed

2. **Create Polar Product** (Sandbox)
   - Create PWYL product in sandbox.polar.sh
   - Set currency to GBP
   - Copy product ID to `POLAR_PWYL_BASE_PRODUCT_ID`

3. **Test Checkout Flow**
   - Test £0 subscription
   - Test various amounts (£1, £5, £7.50, £10)
   - Verify GBP throughout
   - Check webhook processing

4. **Remaining Implementation**:
   - [ ] Add change-amount dialog
   - [ ] Create email templates
   - [ ] Update privacy/T&Cs
   - [ ] Production deployment

---

## 🧪 Testing Commands

### Test £0 Subscription (No Polar)
```bash
curl "http://localhost:3000/api/checkout?product=pwyl&amount=0&household_id=YOUR_HH_ID&user_id=YOUR_USER_ID"

# Should return 302 redirect to /dashboard?upgrade=success
# Check database: SELECT * FROM subscriptions WHERE household_id = 'YOUR_HH_ID';
```

### Test £5 Subscription (Polar Checkout)
```bash
curl "http://localhost:3000/api/checkout?product=pwyl&amount=5&household_id=YOUR_HH_ID&user_id=YOUR_USER_ID"

# Should return 302 redirect to Polar checkout URL
# Complete payment with test card: 4242 4242 4242 4242
# Verify webhook receives subscription.created event
```

### Check Feature Flags
```bash
# In browser console on /pricing:
localStorage.getItem('feature_flags')

# Or check that PWYL matrix is visible (not fixed pricing)
```

---

## 🔍 Troubleshooting

### "Polar checkout creation failed" with 400
- Check that POLAR_PWYL_BASE_PRODUCT_ID is set
- Verify product exists in Polar
- Confirm product currency is GBP
- Check access token is valid for sandbox

### "Missing household_id for £0 subscription"
- Ensure user is logged in
- Verify household exists for user
- Check pricing page passes household_id to matrix

### PWYL matrix not showing
- Check NEXT_PUBLIC_PWYL_PRICING_ENABLED=true
- Restart dev server after env changes
- Verify NEXT_PUBLIC_PRICING_ENABLED=true (master switch)

### TypeScript errors in checkout route
- The `as any` cast is expected (Polar SDK types incomplete)
- Will be fixed after API verification
- Doesn't affect runtime

---

## 📚 Related Documentation

- [PWYL Master Plan](PWYL-MASTER-PLAN.md) - Complete architecture overview
- [Polar API Verification](CRITICAL-POLAR-API-VERIFICATION.md) - Testing dynamic pricing
- [Email Configuration](PWYL-EMAIL-CONFIGURATION.md) - Email setup guide
- [Trial Tracking](TRIAL-CYCLE-TRACKING.md) - Cycle-based trial system
- [Polar Implementation](POLAR-IMPLEMENTATION.md) - Fixed pricing (legacy)

---

## ✨ What's Implemented

**Frontend**:
- Clean £0-£10 slider with no presets/suggestions
- PWYL pricing matrix (3 columns: Trial, Free, Premium PWYL)
- Dynamic CTA showing selected amount
- Conditional rendering (PWYL vs fixed pricing)

**Backend**:
- PWYL checkout route handling `?product=pwyl&amount=X`
- £0 subscriptions skip Polar, grant free premium
- Custom price creation via Polar API (needs verification)
- Webhook stores PWYL amounts in metadata

**Settings**:
- Subscription tab shows PWYL amount
- Different display for £0 (Community Supporter)
- Manage subscription links

**What's NOT Yet Implemented**:
- Change amount dialog
- Email templates (welcome, trial transition)
- Privacy policy updates
- Terms & conditions updates
- Trial banner components

---

**Next Action**: Test Polar API with the curl command in Step 1, then proceed based on result.
