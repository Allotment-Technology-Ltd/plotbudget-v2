# PWYL Pricing - Implementation Summary

## 🎯 Overview

Transform PLOT's pricing from fixed tiers (£4.99/month, £49.99/year) to a pay-what-you-like model with £3/month suggested and no minimum (£0 allowed).

## 📊 Pricing Comparison

| Aspect | Current (Fixed) | New (PWYL) |
|--------|----------------|------------|
| **Monthly** | £4.99 | User chooses (£0-£20, suggested £3) |
| **Annual** | £49.99 | Not initially offered |
| **Free Tier** | 2 pots, 5 needs/wants | Unchanged |
| **Premium** | Unlimited (fixed price) | Unlimited (custom price) |
| **Visibility** | Feature-flagged (hidden) | Default for new users |

## 🔑 Key Design Decisions

### 1. Dual Pricing System
- **PWYL** (default): For new user acquisition
- **Fixed** (legacy): For existing subscribers via feature flag
- **Feature Flags**: `NEXT_PUBLIC_PWYL_PRICING_ENABLED` and `NEXT_PUBLIC_FIXED_PRICING_ENABLED`

### 2. Polar Integration Strategy
**Hybrid Approach**:
- **Preset Prices** (£0, £3, £5, £10): Pre-created in Polar for clean analytics
- **Custom Prices** (e.g., £7.50): Created dynamically via Polar API `product_price_create`
- **£0 Subscriptions**: Bypass Polar, grant premium directly via database

### 3. User Experience
- **Slider**: £0-£20 range, £0.50 steps
- **Presets**: Quick buttons for £0, £3 (suggested), £5, £10
- **Custom Input**: Manual entry for any amount
- **Messaging**: Supportive, gratitude-focused (not guilt-inducing)

## 🏗️ Implementation Components

### New Files to Create

1. **`components/pricing/pricing-amount-selector.tsx`**
   - Interactive slider with presets
   - Custom input validation
   - Supportive messaging based on amount
   - **Status**: Designed, needs implementation

2. **`components/pricing/pricing-matrix-pwyl.tsx`**
   - 3-column layout (Trial, Free, PWYL Premium)
   - Embeds amount selector in Premium card
   - Dynamic CTA with selected amount
   - **Status**: Designed, needs implementation

3. **`lib/utils/pwyl-pricing.ts`**
   - Validation logic
   - Preset price mapping
   - Amount formatting helpers
   - **Status**: Needs creation

### Files to Modify

4. **`app/api/checkout/route.ts`**
   - Add PWYL detection logic
   - Implement custom price creation
   - Handle £0 subscriptions
   - **Current**: Fixed pricing only
   - **Change**: Add PWYL branch

5. **`app/pricing/page.tsx`**
   - Conditional matrix rendering
   - Pass PWYL flag to components
   - **Current**: Always shows fixed matrix
   - **Change**: Render PWYL or fixed based on flags

6. **`app/api/webhooks/polar/route.ts`**
   - Extract and store PWYL amount from metadata
   - Handle PWYL product ID mapping
   - **Current**: Maps fixed products to 'pro' tier
   - **Change**: Also handle PWYL products

7. **`components/settings/subscription-tab.tsx`**
   - Display PWYL amount when applicable
   - "Change Amount" button for PWYL subs
   - **Current**: Shows generic "Premium" plan
   - **Change**: Show "Premium - £3/month (PWYL)"

8. **`lib/feature-flags.ts`**
   - Add PWYL flag getters
   - **Current**: `getPricingEnabledFromEnv()`
   - **Add**: `getPWYLPricingEnabledFromEnv()`, `getFixedPricingEnabledFromEnv()`

### Optional Enhancement

9. **`supabase/migrations/20250213_pwyl_amount.sql`**
   - Add `pwyl_amount_gbp` column to subscriptions table
   - **Current**: Can use metadata, but dedicated column cleaner
   - **Benefit**: Easier analytics queries

## 🔧 Technical Requirements

### Polar Setup (Sandbox First)

1. **Create PWYL Product**:
   ```
   Name: PLOT Premium (PWYL)
   Description: Support PLOT with your chosen monthly contribution
   Type: Subscription
   ```

2. **Create Preset Prices**:
   - £0/month → Price ID (may not be possible in Polar, might need alternative handling)
   - £3/month → Price ID (suggested)
   - £5/month → Price ID (supporter)
   - £10/month → Price ID (champion)

3. **Verify API Capability**:
   - Test `product_price_create` in checkout API
   - If not supported → limit to presets only
   - Document findings

### Environment Variables (New)

```bash
# PWYL Feature Flags
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false

# PWYL Polar Config
POLAR_PWYL_BASE_PRODUCT_ID=<uuid>
POLAR_PWYL_PRICE_3=<uuid>
POLAR_PWYL_PRICE_5=<uuid>
POLAR_PWYL_PRICE_10=<uuid>

# Keep existing for legacy users
POLAR_PREMIUM_PRODUCT_ID=269c7db2-6026-4662-9261-c904be5012d9
POLAR_PREMIUM_ANNUAL_PRODUCT_ID=879e648f-e969-42e0-807c-7d145c3cb92a
```

## 🧪 Testing Plan

### Sandbox Test Cases

| Test | Amount | Expected Behavior | Validation |
|------|--------|-------------------|------------|
| Free premium | £0 | Skip Polar, grant premium | No Polar sub, Settings shows "Free Premium" |
| Suggested | £3 | Use preset price | Uses POLAR_PWYL_PRICE_3 |
| Supporter | £5 | Use preset price | Uses POLAR_PWYL_PRICE_5 |
| Custom | £7.50 | Create custom price | Dynamic price in Polar |
| Edge: Low | £0.50 | Validate minimum | Polar accepts (Stripe min) |
| Edge: High | £20 | Validate maximum | Checkout created successfully |
| Invalid | -£5 | Validation error | 400 error before Polar call |

### User Journey Testing

1. **New User Flow**:
   - Visit /pricing (not logged in) → See PWYL matrix
   - Adjust slider to £5 → See "Thank you for your generous support!"
   - Click signup → Create account
   - Return to /pricing → Slider remembers £5 (via localStorage?)
   - Click "Start Premium" → Checkout with £5
   - Complete payment → Webhook processes
   - Redirect to dashboard → Success toast
   - Visit Settings → See "Premium - £5/month"

2. **Existing User Flow** (if fixed pricing still enabled):
   - Existing subscriber at £4.99/month
   - Visit /pricing → See fixed matrix (via flag)
   - Visit Settings → See "Premium - £4.99/month (Legacy Plan)"
   - No disruption to existing subscription

### Analytics to Verify

```sql
-- Average PWYL amount
SELECT AVG(CAST(metadata->>'pwyl_amount' AS DECIMAL)) as avg_pwyl_amount
FROM public.subscriptions
WHERE polar_product_id = 'POLAR_PWYL_BASE_PRODUCT_ID';

-- Distribution of PWYL amounts
SELECT 
  CAST(metadata->>'pwyl_amount' AS DECIMAL) as amount,
  COUNT(*) as count
FROM public.subscriptions
WHERE polar_product_id = 'POLAR_PWYL_BASE_PRODUCT_ID'
GROUP BY amount
ORDER BY count DESC;

-- Conversion rate: PWYL vs Fixed
SELECT 
  CASE WHEN pwyl_amount_gbp IS NOT NULL THEN 'PWYL' ELSE 'Fixed' END as pricing_model,
  COUNT(*) as subscriptions
FROM public.subscriptions
GROUP BY pricing_model;
```

## ⚠️ Critical Path Items

### 1. Verify Polar API Support (BLOCKER)
**Question**: Does Polar allow custom price creation at checkout?

**Test**:
```bash
curl -X POST https://sandbox-api.polar.sh/v1/checkouts \
  -H "Authorization: Bearer $POLAR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_price_create": {
      "product_id": "YOUR_PWYL_PRODUCT_ID",
      "type": "recurring",
      "recurring_interval": "month",
      "price_amount": 750,
      "price_currency": "GBP"
    },
    "success_url": "https://example.com/success"
  }'
```

**If YES**: Proceed with hybrid approach
**If NO**: Use presets only (£0, £1, £2, £3, £4, £5, £6, £7, £8, £9, £10, £15, £20)

### 2. £0 Subscription Handling (DESIGN CHOICE)
**Options**:
- **A**: Skip Polar, direct DB write (simplest, no payment tracking)
- **B**: Minimum £0.50 for Polar (cleaner for accounting)
- **C**: Create £0 checkout in Polar (full tracking, might fail)

**Recommendation**: Option A with clear "Community Supporter" badging

### 3. Changing PWYL Amount (FUTURE)
**User Story**: "I'm paying £3/month but want to increase to £5"

**Options**:
- **A**: Cancel current, create new subscription
- **B**: Polar update subscription price (if API supports)
- **C**: Link to customer portal, they manage

**Recommendation**: Option C initially (let Polar handle it), add UI later

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Test Polar API for custom price creation
- [ ] Create PWYL product in Polar sandbox
- [ ] Create preset prices (£3, £5, £10)
- [ ] Document API findings

### Phase 1: Backend Infrastructure
- [ ] Add PWYL feature flags to `lib/feature-flags.ts`
- [ ] Create `lib/utils/pwyl-pricing.ts` utilities
- [ ] Update `app/api/checkout/route.ts` with PWYL logic
- [ ] Add £0 subscription handler
- [ ] Update webhook to store PWYL amounts

### Phase 2: UI Components
- [ ] Create `components/pricing/pricing-amount-selector.tsx`
- [ ] Create `components/pricing/pricing-matrix-pwyl.tsx`
- [ ] Update `app/pricing/page.tsx` with conditional rendering
- [ ] Update `components/settings/subscription-tab.tsx` to show PWYL amount

### Phase 3: Testing
- [ ] Test £0 subscriptions (free premium)
- [ ] Test preset amounts (£3, £5, £10)
- [ ] Test custom amounts (£7.50)
- [ ] Verify webhook processing
- [ ] Test Settings display

### Phase 4: Production
- [ ] Create PWYL product in Polar production
- [ ] Create preset prices in production
- [ ] Set production env vars
- [ ] Deploy with flags OFF
- [ ] Test in production
- [ ] Enable PWYL flag
- [ ] Monitor first conversions

## 🎉 Expected Outcomes

### User Acquisition Benefits
- **Lower barrier**: £0 option removes price objection
- **Flexibility**: Users pay what they can afford
- **Goodwill**: PWYL builds trust and community
- **Upsell path**: Start at £0, increase later

### Analytics Insights
- **True willingness to pay**: See what users actually value the product at
- **Price sensitivity**: Understand your market better
- **Conversion rate**: Likely higher than fixed pricing
- **ARPU tracking**: Monitor average revenue vs £4.99 baseline

### Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Low ARPU (below £4.99) | Suggested amount of £3 anchors expectations |
| Too many £0 users | Limit free premium to 3 months, then require payment |
| Abuse (£0.01 spam) | Rate limit, require verified email |
| Complex analytics | Preset prices for common amounts |

## 📖 Documentation Deliverables

Created:
1. [`PWYL-PRICING-PLAN.md`](PWYL-PRICING-PLAN.md) - Detailed technical plan
2. [`PWYL-ARCHITECTURE-DIAGRAM.md`](PWYL-ARCHITECTURE-DIAGRAM.md) - Visual architecture
3. [`PWYL-IMPLEMENTATION-SUMMARY.md`](PWYL-IMPLEMENTATION-SUMMARY.md) - This summary

Existing:
4. [`POLAR-IMPLEMENTATION.md`](POLAR-IMPLEMENTATION.md) - Fixed pricing implementation
5. [`POLAR-TESTING.md`](POLAR-TESTING.md) - Testing procedures

---

## 🚦 Ready to Proceed?

**Next Step**: Verify Polar API supports custom price creation

**Test Command**:
```bash
# Use your existing sandbox token
curl -X POST https://sandbox-api.polar.sh/v1/checkouts \
  -H "Authorization: Bearer ${POLAR_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "product_price_create": {
      "product_id": "CREATE_PWYL_PRODUCT_FIRST",
      "type": "recurring",
      "recurring_interval": "month",
      "price_amount": 750,
      "price_currency": "GBP"
    },
    "success_url": "http://localhost:3000/success"
  }'
```

**If successful** → Proceed with hybrid approach (presets + custom)
**If fails** → Use presets-only approach

---

## 💭 Open Questions

1. **Annual PWYL**: Should we offer annual billing for PWYL? (e.g., 10x monthly amount?)
2. **Free Premium Duration**: Should £0 subscribers get unlimited access or time-limited (3/6 months)?
3. **Grandfathering**: When should existing fixed-price users be migrated to PWYL (if ever)?
4. **Minimum Viable**: Start with presets only (£0, £3, £5, £10) or full slider?

## 🎬 Recommended Implementation Order

1. **Week 1**: Research & Setup
   - Verify Polar API capabilities
   - Create PWYL product + preset prices in sandbox
   - Set up feature flags

2. **Week 2**: Core Implementation
   - Build amount selector component
   - Build PWYL matrix component
   - Update checkout route

3. **Week 3**: Polish & Testing
   - Update Settings display
   - Add £0 handling
   - End-to-end testing in sandbox

4. **Week 4**: Production Launch
   - Create production Polar products
   - Deploy with flag OFF
   - Test in production
   - Enable flag for new users
   - Monitor analytics

**Total Effort**: ~3-4 weeks for full implementation and testing

---

## 📌 Quick Start (If Approved)

1. **First**: Test Polar API with the curl command above
2. **Then**: Create PWYL product in Polar sandbox
3. **Next**: Implement `pricing-amount-selector.tsx` component
4. **Finally**: Wire up checkout flow and test

Would you like me to proceed with implementation or need clarification on any aspect?
