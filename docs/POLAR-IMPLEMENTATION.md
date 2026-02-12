# Polar Payment Implementation Status

## ✅ Completed Components

### 1. Database Schema
- **Migration**: `supabase/migrations/20250212090000_polar_subscriptions.sql`
- **Table**: `public.subscriptions` with household FK, polar_subscription_id, status, tier, trial dates
- **Types**: Generated in `lib/supabase/database.types.ts`

### 2. Environment Configuration
**File**: `apps/web/.env.local`
```bash
# Polar Sandbox (Development)
POLAR_ACCESS_TOKEN=polar_oat_...  # Sandbox access token
POLAR_WEBHOOK_SECRET=polar_whs_...  # Webhook signing secret
POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}
POLAR_PREMIUM_PRODUCT_ID=269c7db2-6026-4662-9261-c904be5012d9  # Monthly product
POLAR_PREMIUM_ANNUAL_PRODUCT_ID=879e648f-e969-42e0-807c-7d145c3cb92a  # Annual product
POLAR_PREMIUM_PRICE_ID=269c7db2-6026-4662-9261-c904be5012d9  # Optional price variant
POLAR_PREMIUM_ANNUAL_PRICE_ID=879e648f-e969-42e0-807c-7d145c3cb92a  # Optional annual price
NEXT_PUBLIC_PRICING_ENABLED=true
```

### 3. Checkout Flow
- **Route**: [`apps/web/app/api/checkout/route.ts`](../apps/web/app/api/checkout/route.ts)
- **SDK**: Direct `@polar-sh/sdk` integration with sandbox mode
- **Query Params**:
  - `product=monthly|annual` (default: monthly)
  - `household_id` (required for metadata)
  - `user_id` (optional for metadata)
- **Metadata**: Attaches household_id and user_id to checkout session for webhook processing

### 4. Webhook Handler
- **Route**: [`apps/web/app/api/webhooks/polar/route.ts`](../apps/web/app/api/webhooks/polar/route.ts)
- **Events Handled**: `subscription.created`, `subscription.updated`
- **Actions**:
  - Validates Polar signature using `POLAR_WEBHOOK_SECRET`
  - Upserts subscription to `public.subscriptions` table
  - Updates `users.subscription_tier` and `subscription_status` for quick reads
  - Maps product IDs to tiers (premium → 'pro')

### 5. UI Components
- **Pricing Page**: [`app/pricing/page.tsx`](../apps/web/app/pricing/page.tsx) - passes household/user metadata to CTA
- **Pricing Matrix**: [`components/pricing/pricing-matrix.tsx`](../apps/web/components/pricing/pricing-matrix.tsx) - CTA links to `/api/checkout`
- **Settings Subscription Tab**: [`components/settings/subscription-tab.tsx`](../apps/web/components/settings/subscription-tab.tsx) - shows plan, status, billing links
- **Success Toast**: [`components/dashboard/checkout-success-toast.tsx`](../apps/web/components/dashboard/checkout-success-toast.tsx) - shows after checkout redirect

---

## 🧪 Testing Checklist

### Webhook Testing
**Current Status**: Webhook handler exists but needs verification.

**Test Steps**:
1. Start ngrok tunnel (if not running):
   ```bash
   ngrok http 3000
   ```

2. Update Polar sandbox webhook endpoint:
   - Go to https://sandbox.polar.sh/settings/webhooks
   - Set URL: `https://YOUR_NGROK_URL.ngrok-free.dev/api/webhooks/polar`
   - Set Secret: (use value from POLAR_WEBHOOK_SECRET in .env.local)
   - Enable events: `subscription.created`, `subscription.updated`, `subscription.canceled`

3. Test subscription flow:
   ```bash
   # Navigate to pricing page
   http://localhost:3000/pricing
   
   # Click "Upgrade to Premium" (must be logged in)
   # Complete checkout with test card: 4242 4242 4242 4242
   # Verify redirect to /dashboard?checkout_id=...
   ```

4. Verify webhook received:
   - Check dev server logs for `[webhook] Received subscription.created`
   - Check Polar dashboard → Webhooks → Recent deliveries
   - Query database:
     ```sql
     SELECT * FROM public.subscriptions 
     WHERE household_id = 'YOUR_HOUSEHOLD_ID'
     ORDER BY created_at DESC LIMIT 1;
     ```

5. Verify Settings UI:
   - Navigate to `/dashboard/settings?tab=subscription`
   - Should show "Premium" plan with "Active" or "Trialing" status
   - "Manage Subscription" link should open Polar customer portal

### Manual Test Card Numbers (Sandbox)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

---

## 🚀 Production Deployment Steps

### Pre-Deployment

1. **Polar Production Setup**:
   - Create production organization at https://polar.sh
   - Create products: "Premium Monthly" (£4.99/month) and "Premium Annual" (£49.99/year)
   - Generate production access token (full scope)
   - Generate production webhook secret
   - Configure webhook endpoint: `https://app.plotbudget.com/api/webhooks/polar`
   - Enable events: subscription.created, subscription.updated, subscription.canceled

2. **Environment Variables** (Vercel/Production):
   ```bash
   POLAR_ACCESS_TOKEN=polar_oat_PRODUCTION_TOKEN
   POLAR_WEBHOOK_SECRET=polar_whs_PRODUCTION_SECRET
   POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}
   POLAR_PREMIUM_PRODUCT_ID=PRODUCTION_MONTHLY_PRODUCT_ID
   POLAR_PREMIUM_ANNUAL_PRODUCT_ID=PRODUCTION_ANNUAL_PRODUCT_ID
   NEXT_PUBLIC_PRICING_ENABLED=false  # Keep false until ready
   ```

3. **Database Migration**:
   ```bash
   # Run migration on production Supabase
   supabase db push --project-ref YOUR_PRODUCTION_REF
   
   # Or via SQL editor in Supabase dashboard
   # Copy content from supabase/migrations/20250212090000_polar_subscriptions.sql
   ```

4. **Type Generation**:
   ```bash
   cd apps/web
   npx supabase gen types typescript --project-id YOUR_PRODUCTION_REF > lib/supabase/database.types.ts
   ```

### Go-Live Sequence

1. Enable pricing in production:
   ```bash
   # Set in Vercel environment variables
   NEXT_PUBLIC_PRICING_ENABLED=true
   ```

2. Monitor first webhook deliveries:
   - Polar dashboard → Webhooks → Recent deliveries
   - Check for 200 OK responses
   - Verify database writes in Supabase

3. Smoke test with real card (small amount):
   - Complete a checkout
   - Verify subscription appears in Settings
   - Cancel and verify webhook processes cancellation

---

## 📋 Remaining Implementation Tasks

### High Priority

1. **Wire Household Metadata to Pricing CTA**
   - Status: Partially complete
   - Issue: TypeScript errors in pricing-matrix.tsx
   - Action: Fix tier.ctaLink type inference or cast

2. **Test Webhook Handler End-to-End**
   - Status: Code exists but not verified
   - Action: Complete checkout in sandbox, verify webhook inserts subscription row
   - Verify: Check ngrok logs, Polar delivery logs, database row

3. **Subscription Tier Logic & Limits**
   - Create helper: `lib/utils/subscription-tier.ts`
   - Function: `getEffectiveTier(user, household)` → considers founding_member_until + subscription
   - Enforce in: `lib/actions/seed-actions.ts` createSeed limit checks
   - UI Hook: `hooks/use-subscription.ts` for components to check tier/limits

### Medium Priority

4. **Customer Portal Link**
   - Current: Hardcoded to sandbox.polar.sh/subscriptions
   - Production: Update to polar.sh/subscriptions (or use Polar's customer portal API)
   - Consider: Store polar_customer_id in subscriptions table for direct links

5. **Success URL Handling**
   - Current: Toast shows on dashboard if checkout_id present
   - Enhancement: Poll subscription status or show loading state while webhook processes
   - Edge case: Handle webhook delay (subscription might not be in DB yet)

6. **Annual Pricing Toggle**
   - Enhancement: Add billing toggle UI on pricing page (monthly/annual switch)
   - Update CTA links to use ?product=annual when toggled

### Low Priority

7. **Error States**
   - Failed payments: Show retry UI in Settings
   - Expired cards: Prompt update before next billing
   - Subscription limits: Show upgrade CTA when hitting free tier limits

8. **Analytics**
   - Track checkout initiated (PostHog event)
   - Track subscription activated (from webhook)
   - Monitor conversion funnel: pricing page → checkout → active subscription

---

## 🐛 Known Issues

### TypeScript Warnings
1. **pricing-matrix.tsx**: `Property 'ctaLink' does not exist on type 'never'`
   - Cause: TIERS const with discriminated union and map inference
   - Fix: Remove `as const` or add explicit type annotation

2. **checkout/route.ts**: Polar SDK type definitions may differ from usage
   - Current: Cast config to `any` to bypass
   - Fix: Align with exact SDK types from @polar-sh/sdk v0.43.0

### Runtime Concerns
- **Webhook Replay**: Polar may retry failed webhooks; upsert handles idempotency
- **Metadata Loss**: If household_id missing from metadata, webhook returns 400
  - Solution: Ensure CTA always includes household_id query param

---

## 📊 Monitoring & Observability

### Key Metrics to Track

1. **Checkout Conversion**:
   - Pricing page visits → Checkout initiated → Subscription created
   - Track failures at each step

2. **Webhook Health**:
   - Polar dashboard: Monitor delivery success rate
   - Log webhook processing times
   - Alert on repeated failures

3. **Subscription Churn**:
   - Track `subscription.canceled` events
   - Monitor trial→paid conversion rate
   - Identify reasons for cancellation (if Polar provides)

### Logging Recommendations

```typescript
// In webhook handler
console.log('[webhook] Received event', {
  type: event.type,
  subscriptionId: data.id,
  householdId: metadata.household_id,
  status: data.status,
});

// In checkout route
console.log('[checkout] Created checkout', {
  productId,
  checkoutUrl: checkout.url,
  metadata: { household_id, user_id },
});
```

---

## 🔒 Security Considerations

1. **Webhook Signature Verification**: ✅ Implemented via `validateEvent()`
2. **Token Security**: ✅ Server-side only (POLAR_ACCESS_TOKEN not exposed to client)
3. **Metadata Validation**: ✅ Webhook requires household_id in metadata
4. **SQL Injection**: ✅ Using Supabase client (parameterized queries)

---

## 📚 Additional Resources

- [Polar SDK Docs](https://github.com/polarsource/polar/tree/main/clients/packages/sdk)
- [Polar Webhook Events](https://docs.polar.sh/webhooks)
- [Polar Sandbox](https://sandbox.polar.sh)
- [Test Cards](https://docs.polar.sh/testing#test-cards)

---

## ✨ Feature Flag Strategy

### Current State
- **Development**: `NEXT_PUBLIC_PRICING_ENABLED=true` in .env.local
- **Production**: `NEXT_PUBLIC_PRICING_ENABLED=false` (not yet live)

### Go-Live Plan
1. Deploy code with pricing flag OFF
2. Verify webhook endpoint is reachable
3. Complete test transaction in production
4. Enable flag: `NEXT_PUBLIC_PRICING_ENABLED=true`
5. Monitor first real transactions

### Rollback
- Set `NEXT_PUBLIC_PRICING_ENABLED=false` to hide pricing/checkout
- Existing subscriptions continue to work via webhook updates
- No code deployment needed for emergency disable
