# Pay-What-You-Like Pricing Architecture

## 📋 Requirements

### Business Model
- **Default**: Pay-what-you-like (PWYL) monthly subscription
- **Suggested Amount**: £3/month
- **Minimum**: None (£0 allowed)
- **Legacy**: Fixed pricing (£4.99/month, £49.99/year) hidden via feature flag for existing users

### User Experience
- Trial (2 pay cycles) → Free tier → PWYL Premium upgrade
- User selects custom amount via slider/input
- Presets: £0, £3 (suggested), £5, £10
- Clear messaging: "Support PLOT development — pay what feels fair"

---

## 🏗️ Architecture Design

### Feature Flag Strategy

```typescript
// lib/feature-flags.ts additions
export function getPWYLPricingEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_PWYL_PRICING_ENABLED === 'true';
}

export function getFixedPricingEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_FIXED_PRICING_ENABLED === 'true';
}

// getPricingEnabledFromEnv() gates the entire pricing feature
// PWYL vs Fixed determines which matrix to show
```

**Environment Variables**:
```bash
# Feature gates
NEXT_PUBLIC_PRICING_ENABLED=true          # Master switch for pricing feature
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true     # Show PWYL matrix
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false   # Show fixed pricing (legacy)

# Polar Products (PWYL uses custom prices, but keep for fallback)
POLAR_PWYL_BASE_PRODUCT_ID=<uuid>         # Single product for PWYL subscriptions
```

**Flag Precedence**:
1. If `NEXT_PUBLIC_PRICING_ENABLED=false` → No pricing shown, redirect to dashboard
2. If `NEXT_PUBLIC_FIXED_PRICING_ENABLED=true` → Show fixed pricing matrix (£4.99/£49.99)
3. If `NEXT_PUBLIC_PWYL_PRICING_ENABLED=true` → Show PWYL matrix
4. Default (both false): Show PWYL as the new standard

---

## 🎨 UI/UX Design

### PWYL Pricing Matrix Component

```
┌─────────────┬─────────────┬──────────────────────┐
│   Trial     │    Free     │   Premium (PWYL)     │
│ (unchanged) │ (unchanged) │  ┌────────────────┐  │
│             │             │  │ Choose Amount: │  │
│             │             │  │                │  │
│             │             │  │ £0  £3  £5  £10 │  │
│             │             │  │ [====●=======]  │  │
│             │             │  │                │  │
│             │             │  │ £3.00 /month   │  │
│             │             │  │ [Start Premium]│  │
│             │             │  └────────────────┘  │
└─────────────┴─────────────┴──────────────────────┘
```

**Component Structure**:
- `pricing-matrix-pwyl.tsx` - New component for PWYL version
- `pricing-amount-selector.tsx` - Interactive amount picker (slider + input + presets)
- `pricing-matrix-fixed.tsx` - Extract existing fixed pricing to separate component (optional refactor)

### Amount Selector Features

1. **Quick Presets**:
   - £0 (Free access)
   - £3 (Suggested)
   - £5 (Supporter)
   - £10 (Champion)

2. **Custom Slider**:
   - Range: £0 - £20
   - Step: £0.50
   - Visual feedback: Color intensity increases with amount

3. **Direct Input**:
   - Allow typing custom amount
   - Validate: Must be ≥ 0, reasonable max (£100?)
   - Round to 2 decimal places

4. **Messaging**:
   - Below £3: "Every bit helps us build a better PLOT"
   - £3: "Suggested amount — thank you!"
   - Above £5: "Wow, thank you for your generous support!"

---

## 🔧 Technical Implementation

### Polar Integration Options

#### Option A: Custom Prices at Checkout (Recommended)
Polar supports creating ad-hoc prices via the API:

```typescript
// apps/web/app/api/checkout/route.ts modification
const checkout = await polar.checkouts.create({
  // Create custom price on-the-fly
  product_price_create: {
    product_id: process.env.POLAR_PWYL_BASE_PRODUCT_ID!,
    type: 'recurring',
    recurring_interval: 'month',
    price_amount: customAmountInPence, // £3 = 300 pence
    price_currency: 'GBP',
  },
  successUrl: process.env.POLAR_SUCCESS_URL!,
  metadata: { household_id, user_id, pwyl_amount: customAmount },
});
```

**Pros**:
- Flexible - any amount
- Single product in Polar
- Clean metadata tracking

**Cons**:
- Creates many price variants in Polar
- Might complicate reporting

#### Option B: Preset Price IDs
Create multiple price variants in Polar for common amounts:

```bash
POLAR_PWYL_PRICE_0=<uuid>   # £0/month (free tier, no payment)
POLAR_PWYL_PRICE_3=<uuid>   # £3/month
POLAR_PWYL_PRICE_5=<uuid>   # £5/month
POLAR_PWYL_PRICE_10=<uuid>  # £10/month
# Custom amounts use Option A fallback
```

**Pros**:
- Cleaner Polar dashboard
- Easier reporting on popular tiers

**Cons**:
- Less flexible
- Custom amounts still need dynamic price creation

#### Recommended Approach: Hybrid
- Use preset prices for £0, £3, £5, £10 (common amounts)
- Custom price creation for other amounts
- This gives clean analytics while supporting full flexibility

---

### Checkout Route Modifications

**Current**: Fixed product selection (monthly/annual)
**New**: Support custom amount parameter

```typescript
// apps/web/app/api/checkout/route.ts

export const GET = async (req: NextRequest) => {
  const productParam = req.nextUrl.searchParams.get('product'); // 'monthly' | 'annual' | 'pwyl'
  const customAmount = req.nextUrl.searchParams.get('amount'); // e.g., '3.00'
  
  const pricingMode = process.env.NEXT_PUBLIC_PWYL_PRICING_ENABLED === 'true' ? 'pwyl' : 'fixed';
  
  if (pricingMode === 'pwyl' || productParam === 'pwyl') {
    return handlePWYLCheckout(req, customAmount);
  }
  
  return handleFixedCheckout(req, productParam);
};

async function handlePWYLCheckout(req: NextRequest, amountStr: string | null) {
  const amount = parseFloat(amountStr || '3.00'); // Default to suggested
  const amountInPence = Math.round(amount * 100);
  
  // If amount is 0, maybe skip payment and just activate "supporter" tier?
  if (amountInPence === 0) {
    // Option 1: Create free subscription (no payment)
    // Option 2: Just mark as premium tier in DB without Polar subscription
    // Option 3: Still create £0 checkout for tracking
  }
  
  // Check for preset price
  const presetPriceId = getPresetPriceId(amountInPence);
  
  if (presetPriceId) {
    // Use existing price
    const checkout = await polar.checkouts.create({
      products: [presetPriceId],
      successUrl: process.env.POLAR_SUCCESS_URL!,
      metadata: { household_id, user_id, pwyl_amount: amountStr },
    });
  } else {
    // Create custom price
    const checkout = await polar.checkouts.create({
      product_price_create: {
        product_id: process.env.POLAR_PWYL_BASE_PRODUCT_ID!,
        type: 'recurring',
        recurring_interval: 'month',
        price_amount: amountInPence,
        price_currency: 'GBP',
      },
      successUrl: process.env.POLAR_SUCCESS_URL!,
      metadata: { household_id, user_id, pwyl_amount: amountStr },
    });
  }
  
  return NextResponse.redirect(checkout.url, 302);
}

function getPresetPriceId(amountInPence: number): string | undefined {
  const presets: Record<number, string | undefined> = {
    0: process.env.POLAR_PWYL_PRICE_0,
    300: process.env.POLAR_PWYL_PRICE_3,    // £3
    500: process.env.POLAR_PWYL_PRICE_5,    // £5
    1000: process.env.POLAR_PWYL_PRICE_10,  // £10
  };
  return presets[amountInPence];
}
```

---

### Database Considerations

**Existing Schema** (no changes needed):
- `subscriptions.polar_product_id` stores the product/price used
- `subscriptions.metadata` can include PWYL amount
- `subscriptions.current_tier` = 'pro' for all PWYL subscribers

**Optional Enhancement**:
```sql
-- Add column to track PWYL amount for analytics
ALTER TABLE public.subscriptions
ADD COLUMN pwyl_amount_gbp DECIMAL(10,2) NULL;

COMMENT ON COLUMN public.subscriptions.pwyl_amount_gbp IS 'Pay-what-you-like amount in GBP (null for fixed-price subscriptions)';
```

---

## 🎯 Component Architecture

### New Components

#### 1. `components/pricing/pricing-matrix-pwyl.tsx`
```typescript
'use client';

interface PWYLPricingMatrixProps {
  isLoggedIn: boolean;
  householdId?: string | null;
  userId?: string | null;
}

export function PWYLPricingMatrix({ isLoggedIn, householdId, userId }: PWYLPricingMatrixProps) {
  const [selectedAmount, setSelectedAmount] = useState(3); // Default £3
  
  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-8">
      {/* Trial Tier (unchanged) */}
      <TierCard tier="trial" />
      
      {/* Free Tier (unchanged) */}
      <TierCard tier="free" />
      
      {/* Premium PWYL */}
      <div className="premium-tier-card">
        <h2>Premium</h2>
        <p>Unlimited pots</p>
        
        {/* Amount Selector */}
        <PricingAmountSelector
          value={selectedAmount}
          onChange={setSelectedAmount}
          suggested={3}
        />
        
        {/* CTA */}
        <Link href={buildPWYLCheckoutUrl(selectedAmount, householdId, userId)}>
          Start Premium
        </Link>
        
        {/* Features list */}
        <ul>
          <li>Unlimited Needs</li>
          <li>Unlimited Wants</li>
          <li>Unlimited savings pots</li>
          <li>Unlimited repayments</li>
        </ul>
      </div>
    </div>
  );
}

function buildPWYLCheckoutUrl(amount: number, householdId?: string | null, userId?: string | null): string {
  const params = new URLSearchParams({
    product: 'pwyl',
    amount: amount.toFixed(2),
    ...(householdId ? { household_id: householdId } : {}),
    ...(userId ? { user_id: userId } : {}),
  });
  return `/api/checkout?${params}`;
}
```

#### 2. `components/pricing/pricing-amount-selector.tsx`
```typescript
'use client';

import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface PricingAmountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  suggested: number;
  min?: number;
  max?: number;
}

export function PricingAmountSelector({
  value,
  onChange,
  suggested = 3,
  min = 0,
  max = 20,
}: PricingAmountSelectorProps) {
  const presets = [
    { amount: 0, label: 'Free' },
    { amount: 3, label: 'Suggested', isSuggested: true },
    { amount: 5, label: 'Supporter' },
    { amount: 10, label: 'Champion' },
  ];
  
  const message = getMessageForAmount(value, suggested);
  
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Choose your monthly contribution
        </label>
        
        {/* Quick Presets */}
        <div className="flex gap-2 mb-4">
          {presets.map((preset) => (
            <button
              key={preset.amount}
              onClick={() => onChange(preset.amount)}
              className={`
                flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors
                ${value === preset.amount
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border hover:bg-accent'
                }
                ${preset.isSuggested ? 'ring-2 ring-primary/20' : ''}
              `}
            >
              £{preset.amount}
              <span className="block text-xs opacity-70">{preset.label}</span>
            </button>
          ))}
        </div>
        
        {/* Slider */}
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={0.5}
          className="mb-4"
        />
        
        {/* Custom Input */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">£</span>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={0.5}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
      </div>
      
      {/* Supportive Message */}
      <p className="text-xs text-center text-muted-foreground italic">
        {message}
      </p>
    </div>
  );
}

function getMessageForAmount(amount: number, suggested: number): string {
  if (amount === 0) return "We appreciate you using PLOT — every user helps us improve!";
  if (amount < suggested) return "Every contribution helps us build a better PLOT. Thank you!";
  if (amount === suggested) return "Perfect! This is our suggested amount. Thank you for your support!";
  if (amount <= suggested * 2) return "Thank you for your generous support!";
  return "Wow! Your contribution means the world to us. Thank you!";
}
```

---

## 🔄 Checkout Flow Modifications

### Updated Checkout Route Logic

```typescript
// apps/web/app/api/checkout/route.ts

function resolveCheckoutConfig(req: NextRequest): CheckoutConfig {
  const productParam = req.nextUrl.searchParams.get('product'); // 'monthly' | 'annual' | 'pwyl'
  const customAmount = req.nextUrl.searchParams.get('amount'); // e.g., '3.00'
  
  // PWYL mode
  if (productParam === 'pwyl' || process.env.NEXT_PUBLIC_PWYL_PRICING_ENABLED === 'true') {
    const amount = parseFloat(customAmount || '3.00');
    const amountInPence = Math.round(Math.max(0, amount) * 100);
    
    // Handle £0 subscriptions
    if (amountInPence === 0) {
      return {
        mode: 'free_premium',
        // Skip Polar checkout, just grant premium tier via webhook simulation or direct DB write
      };
    }
    
    // Check preset prices first
    const presetPriceId = getPresetPWYLPriceId(amountInPence);
    if (presetPriceId) {
      return {
        mode: 'preset',
        priceId: presetPriceId,
        amount: amountInPence,
      };
    }
    
    // Custom price creation
    return {
      mode: 'custom',
      productId: process.env.POLAR_PWYL_BASE_PRODUCT_ID!,
      amount: amountInPence,
      interval: 'month',
    };
  }
  
  // Fixed pricing mode (legacy)
  return {
    mode: 'fixed',
    productId: productParam === 'annual' 
      ? process.env.POLAR_PREMIUM_ANNUAL_PRODUCT_ID 
      : process.env.POLAR_PREMIUM_PRODUCT_ID,
  };
}

export const GET = async (req: NextRequest) => {
  const config = resolveCheckoutConfig(req);
  
  if (config.mode === 'free_premium') {
    // Handle £0 subscriptions
    // Option 1: Direct DB write (no Polar subscription)
    // Option 2: Redirect to dashboard with success message
    return handleFreePremium(req);
  }
  
  const polar = new Polar({ 
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: 'sandbox' as any,
  });
  
  let checkout;
  
  if (config.mode === 'custom') {
    // Create custom price at checkout time
    checkout = await polar.checkouts.create({
      product_price_create: {
        product_id: config.productId,
        type: 'recurring',
        recurring_interval: config.interval,
        price_amount: config.amount,
        price_currency: 'GBP',
      },
      successUrl: process.env.POLAR_SUCCESS_URL!,
      metadata: extractMetadata(req, config.amount),
    });
  } else {
    // Use existing product/price
    checkout = await polar.checkouts.create({
      products: [config.productId || config.priceId!],
      successUrl: process.env.POLAR_SUCCESS_URL!,
      metadata: extractMetadata(req),
    });
  }
  
  return NextResponse.redirect(checkout.url, 302);
};
```

---

### Handling £0 Subscriptions

**Challenge**: Polar requires payment for subscriptions. How to handle £0?

**Solution Options**:

1. **Skip Polar for £0** (Recommended):
   ```typescript
   async function handleFreePremium(req: NextRequest) {
     // Direct DB write (requires auth check)
     const supabase = await createServerSupabaseClient();
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return NextResponse.redirect('/login', 302);
     
     const householdId = req.nextUrl.searchParams.get('household_id');
     if (!householdId) return NextResponse.json({ error: 'Missing household_id' }, { status: 400 });
     
     // Create subscription record (no Polar ID)
     await supabase.from('subscriptions').insert({
       household_id: householdId,
       polar_subscription_id: `local_free_${householdId}`, // Synthetic ID
       status: 'active',
       current_tier: 'pro',
       polar_product_id: 'pwyl_free',
     });
     
     return NextResponse.redirect(`/dashboard?upgrade=success`, 302);
   }
   ```

2. **Minimum £0.50 for Polar**:
   - Set actual minimum at £0.50 (Polar/Stripe minimum)
   - UI shows £0 but creates £0.50 checkout
   - Clearer for accounting

3. **Donation Model**:
   - £0 = Free tier (no premium)
   - Must pay something for premium
   - Reframe as "Support development" not "Pay what you like"

**Recommendation**: Option 1 (skip Polar for £0) with clear messaging that £0 users are "community supporters" and still get premium features as a thank-you.

---

## 🗂️ File Structure

```
apps/web/
├── app/
│   ├── api/
│   │   └── checkout/
│   │       └── route.ts              # Modified: support PWYL amounts
│   ├── pricing/
│   │   └── page.tsx                  # Modified: conditional matrix rendering
│   └── dashboard/
│       └── settings/
│           └── page.tsx               # Modified: fetch PWYL amount from subscription
├── components/
│   ├── pricing/
│   │   ├── pricing-matrix.tsx        # Keep for fixed pricing (legacy)
│   │   ├── pricing-matrix-pwyl.tsx   # NEW: PWYL version
│   │   └── pricing-amount-selector.tsx # NEW: Interactive amount picker
│   └── settings/
│       └── subscription-tab.tsx      # Modified: show PWYL amount
└── lib/
    └── feature-flags.ts              # NEW: PWYL flags
```

---

## 📊 Data Flow

```mermaid
graph TD
    A[User visits /pricing] --> B{Pricing Model}
    B -->|PWYL enabled| C[PWYLPricingMatrix]
    B -->|Fixed enabled| D[FixedPricingMatrix]
    
    C --> E[Select custom amount £3]
    E --> F[Click Start Premium]
    F --> G[/api/checkout?product=pwyl&amount=3.00&household_id=...]
    
    G --> H{Amount check}
    H -->|£0| I[Direct DB write - Free Premium]
    H -->|Preset £3/5/10| J[Use preset price ID]
    H -->|Custom amount| K[Create ad-hoc price]
    
    I --> L[Redirect to dashboard]
    J --> M[Create Polar checkout]
    K --> M
    
    M --> N[Redirect to Polar checkout]
    N --> O[User completes payment]
    O --> P[Polar webhook to /api/webhooks/polar]
    
    P --> Q[Store subscription + PWYL amount]
    Q --> R[Redirect to success URL]
    R --> L
```

---

## 🎨 UI/UX Mockup - PWYL Premium Card

```
┌────────────────────────────────────┐
│  🌟 Most Flexible                  │
├────────────────────────────────────┤
│  PREMIUM                           │
│  Unlimited pots                    │
│                                    │
│  ┌──────────────────────────────┐ │
│  │ Support PLOT — Pay what you  │ │
│  │ think is fair                │ │
│  │                              │ │
│  │  [£0] [£3✨] [£5] [£10]      │ │
│  │                              │ │
│  │  £  [___3.00___]  /month     │ │
│  │      ▔▔▔▔▔●▔▔▔▔▔▔            │ │
│  │      0   3   10   20          │ │
│  │                              │ │
│  │  Suggested: £3/month         │ │
│  └──────────────────────────────┘ │
│                                    │
│  ✓ Unlimited Needs                │
│  ✓ Unlimited Wants                │
│  ✓ Unlimited savings pots         │
│  ✓ Unlimited repayments           │
│                                    │
│  ┌──────────────────────────────┐ │
│  │    [Start Premium - £3/mo]   │ │
│  └──────────────────────────────┘ │
│                                    │
│  Thank you for supporting PLOT!   │
└────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Sandbox Test Scenarios

1. **£0 Subscription** (if supported):
   - Select £0
   - Verify premium access granted
   - Check no Polar subscription created (or £0 in Polar)

2. **Preset Amounts** (£3, £5, £10):
   - Select each preset
   - Verify correct price ID used
   - Check webhook processes correctly

3. **Custom Amount** (e.g., £7.50):
   - Enter custom amount
   - Verify ad-hoc price created in Polar
   - Confirm subscription active

4. **Edge Cases**:
   - £0.01 (minimum Stripe/Polar allows)
   - £100 (high amount)
   - Non-logged-in users (should redirect to signup)
   - Missing household_id (should show error)

### Validation Rules

```typescript
function validatePWYLAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 0) return { valid: false, error: 'Amount cannot be negative' };
  if (amount > 100) return { valid: false, error: 'Maximum amount is £100/month' };
  if (amount > 0 && amount < 0.5) return { valid: false, error: 'Minimum paid amount is £0.50' };
  // £0 or £0.50+ is valid
  return { valid: true };
}
```

---

## 🚀 Implementation Plan

### Phase 1: Foundation
1. Add PWYL feature flags to `lib/feature-flags.ts`
2. Create PWYL product in Polar sandbox (single product for all amounts)
3. Create preset prices in Polar (£0, £3, £5, £10)
4. Add env vars for PWYL product/price IDs

### Phase 2: Components
5. Create `pricing-amount-selector.tsx` with slider/presets
6. Create `pricing-matrix-pwyl.tsx` using selector
7. Update `app/pricing/page.tsx` to conditionally render matrix based on flags

### Phase 3: Backend
8. Modify `/api/checkout/route.ts` to:
   - Accept `?product=pwyl&amount=X.XX` parameters
   - Use preset prices for common amounts
   - Create custom prices for other amounts
   - Handle £0 subscriptions (free premium)

9. Update webhook handler to store PWYL amount in metadata

### Phase 4: Settings & UI
10. Update subscription tab to show PWYL amount
11. Add "Change Amount" button (links to Polar customer portal or new checkout)
12. Show appreciation messaging based on contribution level

### Phase 5: Testing & Docs
13. Test all PWYL amounts in sandbox
14. Document PWYL setup in `docs/PWYL-PRICING-PLAN.md`
15. Create production deployment guide

---

## ⚠️ Polar API Constraints

### Research Needed
**Question**: Does Polar support creating custom prices at checkout time?

**If YES**:
- Use `product_price_create` in checkout API
- Single product, dynamic prices

**If NO**:
- Must pre-create price tiers in Polar
- Limit to preset amounts (£0, £3, £5, £10, maybe £1, £2, £4, £6, £7, £8, £9, £10)
- Custom amounts round to nearest preset

**Action**: Test in sandbox:
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

---

## 💡 Alternative Approaches

### Option: Stripe Checkout Links (if Polar doesn't support custom prices)

If Polar doesn't support ad-hoc pricing, consider:
1. Use Stripe Checkout directly for PWYL
2. Keep Polar for fixed pricing (legacy users)
3. Hybrid: Polar for preset amounts, Stripe for custom

### Option: Round to Nearest Preset

Simplest fallback:
- User selects any amount
- Round to nearest preset (£0, £3, £5, £10)
- Show "Rounded to £X" message before checkout

---

## 📈 Business Considerations

### Conversion Optimization

**PWYL Benefits**:
- Lower barrier to entry
- User feels in control
- Captures price-sensitive users
- Can A/B test suggested amounts

**PWYL Risks**:
- Average revenue per user (ARPU) might drop
- Admin overhead for many price variants
- Analytics complexity

**Mitigation**:
- Track PWYL vs fixed conversion rates
- Monitor average PWYL amount
- Set reasonable suggested amount (£3 < £4.99)
- Limit custom amounts to reasonable range

### Analytics to Track

```typescript
// PostHog events
{
  event: 'pricing_amount_selected',
  amount: 3.00,
  is_preset: true,
  is_suggested: true,
}

{
  event: 'checkout_created',
  amount: 3.00,
  pricing_mode: 'pwyl',
  household_id: '...',
}

{
  event: 'subscription_activated',
  amount: 3.00,
  pricing_mode: 'pwyl',
  subscription_tier: 'pro',
}
```

---

## 🔒 Security & Validation

### Client-Side
- Validate amount input (0-100 range)
- Show clear error messages
- Disable CTA if invalid

### Server-Side
```typescript
// In /api/checkout
const amount = parseFloat(req.nextUrl.searchParams.get('amount') || '3.00');

// Strict validation
if (amount < 0 || amount > 100) {
  return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
}

// Round to prevent precision issues
const amountInPence = Math.round(amount * 100);

// Stripe/Polar minimum check
if (amountInPence > 0 && amountInPence < 50) {
  return NextResponse.json({ 
    error: 'Minimum payment amount is £0.50' 
  }, { status: 400 });
}
```

### Fraud Prevention
- Rate limit checkout creation per household
- Log unusual amounts (e.g., £0.01, £99.99)
- Monitor for abuse patterns

---

## 📋 Environment Variables Summary

```bash
# Master Switches
NEXT_PUBLIC_PRICING_ENABLED=true                  # Enable pricing feature
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true             # Use PWYL model
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false           # Use fixed model (legacy)

# Polar Products - PWYL
POLAR_PWYL_BASE_PRODUCT_ID=<uuid>                 # Single product for PWYL
POLAR_PWYL_PRICE_0=<uuid>                         # £0/month (optional - might not need Polar for this)
POLAR_PWYL_PRICE_3=<uuid>                         # £3/month (suggested)
POLAR_PWYL_PRICE_5=<uuid>                         # £5/month
POLAR_PWYL_PRICE_10=<uuid>                        # £10/month

# Polar Products - Fixed (existing, keep for legacy)
POLAR_PREMIUM_PRODUCT_ID=269c7db2-6026-4662-9261-c904be5012d9
POLAR_PREMIUM_ANNUAL_PRODUCT_ID=879e648f-e969-42e0-807c-7d145c3cb92a

# Polar Config (unchanged)
POLAR_ACCESS_TOKEN=polar_oat_...
POLAR_WEBHOOK_SECRET=polar_whs_...
POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}
```

---

## 🎯 Migration Strategy

### Existing Users (Fixed Pricing)
- Already subscribed at £4.99 or £49.99
- Continue at their current price
- Webhook identifies them via existing `polar_product_id`
- Settings shows their legacy plan

### New Users (PWYL)
- See PWYL pricing matrix
- Choose custom amount
- Webhook stores `pwyl_amount_gbp` in subscription
- Can change amount via "Manage Subscription" (creates new checkout)

### Flag Rollout
```bash
# Week 1: Deploy with PWYL disabled
NEXT_PUBLIC_PWYL_PRICING_ENABLED=false
NEXT_PUBLIC_FIXED_PRICING_ENABLED=true

# Week 2: Enable PWYL for new users, keep existing subscriptions
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false

# Future: Optionally migrate legacy users to PWYL
# (via email campaign + cancel/resubscribe flow)
```

---

## 📝 Next Steps

1. **Research Polar API**: Confirm `product_price_create` support in @polar-sh/sdk v0.43.0
2. **Create Polar Products**: Set up PWYL product + preset prices in sandbox
3. **Build Components**: `pricing-amount-selector.tsx` + `pricing-matrix-pwyl.tsx`
4. **Update Checkout**: Add PWYL logic to `/api/checkout/route.ts`
5. **Test Flow**: Complete PWYL checkout with various amounts
6. **Update Docs**: Add PWYL section to implementation guide
