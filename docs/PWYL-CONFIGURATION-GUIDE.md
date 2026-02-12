# PWYL Pricing - Configuration Guide

## 🌍 Polar Currency Configuration

### Setting Up GBP (British Pounds)

Polar supports multi-currency checkout. To ensure charges are in GBP:

#### 1. Organization Settings
1. Log into Polar dashboard (sandbox.polar.sh for testing)
2. Go to **Settings** → **Organization**
3. Set **Default Currency**: GBP
4. Save changes

#### 2. Product Creation (GBP)
When creating the PWYL product:
```
Product Settings:
├── Name: PLOT Premium (Pay What You Like)
├── Currency: GBP 🇬🇧
├── Type: Subscription
└── Billing: Monthly recurring
```

#### 3. Price Creation (GBP)
For each preset price (£3, £5, £10):
```
Price Settings:
├── Amount: 300 (for £3) / 500 (for £5) / 1000 (for £10)
├── Currency: GBP
├── Type: Recurring
├── Interval: Month
└── Interval Count: 1
```

#### 4. API Calls (GBP)
When creating custom prices dynamically:
```typescript
const checkout = await polar.checkouts.create({
  product_price_create: {
    product_id: process.env.POLAR_PWYL_BASE_PRODUCT_ID!,
    type: 'recurring',
    recurring_interval: 'month',
    price_amount: amountInPence, // e.g., 750 for £7.50
    price_currency: 'GBP',  // ⚠️ CRITICAL: Must specify GBP
  },
  // ...
});
```

**Important**: Always specify `price_currency: 'GBP'` in custom price creation to avoid USD default.

---

## 🎁 Trial Period Configuration (2 Pay Cycles)

### Challenge: Polar vs PLOT Pay Cycles

**Polar Trial**: Time-based (days/months)
**PLOT Trial**: Event-based (2 pay cycles)

**User pay cycle examples**:
- Monthly on 1st: Pay cycle = ~30 days → 2 cycles = ~60 days trial
- Every 4 weeks: Pay cycle = 28 days → 2 cycles = 56 days trial
- Last working day: Variable (~28-31 days) → 2 cycles = ~58-62 days

### Solution: Approximate with 60-Day Trial

Since Polar doesn't support "2 billing cycles" natively, use 60-day trial as reasonable approximation:

#### Option A: Polar Product-Level Trial (Recommended)
```
Product Settings (in Polar dashboard):
├── Name: PLOT Premium (PWYL)
├── Trial Period: 60 days
├── Trial automatically included: Yes
└── Customer can skip trial: No
```

**Pros**: Automatic, no code needed
**Cons**: Fixed 60 days for everyone

#### Option B: Checkout-Level Trial
```typescript
// In /api/checkout
const checkout = await polar.checkouts.create({
  products: [priceId],
  subscription_trial_end: calculateTrialEnd(), // 60 days from now
  // ...
});

function calculateTrialEnd(): string {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
  return trialEnd.toISOString();
}
```

**Pros**: Flexible, can adjust per user
**Cons**: More complex, requires code

#### Option C: PLOT-Managed Trial (Most Accurate)
Track trials in PLOT database, not Polar:

```typescript
// Don't use Polar trial; manage in PLOT
// User gets 2 pay cycles from onboarding date
// After 2 cycles → show upgrade CTA
// When they subscribe → no Polar trial (immediate billing)
```

**Pros**: Exact 2-pay-cycle accuracy
**Cons**: Complex logic, requires tracking cycle completions

### Recommended Approach: Option A + Option C Hybrid

1. **New users**: Track trial in PLOT (2 pay cycles from onboarding)
2. **Upgrade to PWYL**: No Polar trial (they already had PLOT trial)
3. **Polar trial period**: Set to 0 days for PWYL products

**Benefit**: Users don't get double trial; PLOT trial is the official one.

```
Timeline:
Day 0: User signs up → PLOT trial starts
Day 30: First pay cycle completes
Day 60: Second pay cycle completes → Trial ends
Day 61: User sees "Upgrade to Premium" prominently
Day 65: User upgrades with PWYL (£3/month) → Billing starts immediately (no Polar trial)
```

### Implementation in Polar

**Product Settings**:
```
PLOT Premium (PWYL)
├── Trial Period: 0 days
├── Reason: Trial handled by PLOT app (2 pay cycles)
└── Billing: Starts immediately upon subscription
```

**In PLOT Code** (existing trial logic):
```typescript
// lib/utils/pay-cycle-dates.ts (already exists)
// Tracks pay cycle count since user onboarding
// After 2 completed cycles → trial expired

// components/dashboard/upgrade-cta.tsx (new)
// Show prominent PWYL upgrade CTA after trial expires
```

---

## 🎨 Complete PWYL User Journey

### Journey Map

```
1. Discovery
   ↓
2. Signup → Trial Start (2 pay cycles)
   ↓
3. Use PLOT (run 2 pay cycle rituals)
   ↓
4. Trial Expiry → Upgrade CTA
   ↓
5. Visit /pricing → See PWYL matrix
   ↓
6. Select amount (£0-£10 slider, £3 suggested)
   ↓
7. Click "Start Premium - £X/mo"
   ↓
8. Redirect to /api/checkout?product=pwyl&amount=X
   ↓
9. Polar checkout page (if amount > 0) OR skip to dashboard (if £0)
   ↓
10. Complete payment / Skip
    ↓
11. Webhook processes subscription
    ↓
12. Redirect to /dashboard?checkout_id=XXX
    ↓
13. Success toast: "Welcome to Premium!"
    ↓
14. Settings → Subscription tab shows plan
    ↓
15. Ongoing: Use unlimited features
    ↓
16. Manage: Click "Manage Subscription" → Polar portal
```

### Pages & Components Needed

| Page/Component | PWYL Behavior | Status |
|----------------|---------------|--------|
| `/pricing` | Show PWYL matrix when flag enabled | Needs update |
| `pricing-matrix-pwyl.tsx` | 3 columns with amount selector in Premium | Needs creation |
| `pricing-amount-selector.tsx` | Slider £0-£10, presets, custom input | Needs creation |
| `/api/checkout` | Handle `product=pwyl&amount=X` | Needs update |
| `/api/webhooks/polar` | Store PWYL amount from metadata | Needs update |
| `/dashboard` | Show success toast on checkout_id | Already implemented ✅ |
| `/dashboard/settings` | Subscription tab visible when PWYL enabled | Needs update |
| `subscription-tab.tsx` | Show "Premium - £3/mo (PWYL)" + change amount | Needs update |

### Subscription Management Features

#### Settings → Subscription Tab (PWYL)

**For Active PWYL Subscriber (£3/month)**:
```
┌─────────────────────────────────────────────┐
│ Subscription                                │
├─────────────────────────────────────────────┤
│ Current Plan: Premium (Pay What You Like)   │
│ Status: ● Active                            │
│                                             │
│ You're contributing: £3.00/month            │
│ Thank you for supporting PLOT!              │
│                                             │
│ [Change Amount]  [Manage Subscription ↗]   │
│                                             │
│ Your household has unlimited pots and       │
│ no limits on bills or wants.                │
└─────────────────────────────────────────────┘
```

**For Free Premium (£0/month)**:
```
┌─────────────────────────────────────────────┐
│ Subscription                                │
├─────────────────────────────────────────────┤
│ Current Plan: Premium (Community Supporter) │
│ Status: ● Active                            │
│                                             │
│ You're using PLOT for free.                 │
│ Consider contributing to support development│
│                                             │
│ [Start Contributing]                        │
│                                             │
│ Your household has unlimited pots and       │
│ no limits on bills or wants.                │
└─────────────────────────────────────────────┘
```

**For Trial User**:
```
┌─────────────────────────────────────────────┐
│ Subscription                                │
├─────────────────────────────────────────────┤
│ Current Plan: Trial (1 of 2 cycles used)    │
│ Status: ● Active                            │
│                                             │
│ Trial ends after your next pay cycle.       │
│ Then choose: Free tier or Premium (PWYL)    │
│                                             │
│ [View Pricing]                              │
└─────────────────────────────────────────────┘
```

#### "Change Amount" Flow

**User Story**: "I'm paying £3/month but want to increase to £5"

**Implementation**:
```typescript
// components/settings/change-amount-dialog.tsx (new)
// Opens modal with amount selector
// Creates new checkout with different amount
// Polar cancels old subscription, creates new one

<ChangeAmountDialog
  currentAmount={3}
  onConfirm={(newAmount) => {
    window.location.href = `/api/checkout?product=pwyl&amount=${newAmount}&action=change`;
  }}
/>
```

**Backend** (`/api/checkout`):
```typescript
// When action=change, include current subscription ID
// Polar will cancel old and create new subscription at new price
if (req.nextUrl.searchParams.get('action') === 'change') {
  const currentSubId = req.nextUrl.searchParams.get('subscription_id');
  // Include in checkout metadata
  metadata.replacing_subscription_id = currentSubId;
}
```

---

## 💷 Currency Configuration Details

### Polar Product Setup (GBP)

**Step-by-Step**:

1. **Create Product**:
   ```
   Navigation: sandbox.polar.sh → Products → Create Product
   
   Settings:
   ├── Name: PLOT Premium (PWYL)
   ├── Description: "Support PLOT with your chosen monthly contribution. Pay what feels fair."
   ├── Type: Subscription
   ├── Pricing Model: Recurring
   ├── Currency: GBP (select from dropdown)
   └── Billing: Monthly
   ```

2. **Create Preset Prices** (in product):
   ```
   Click "Add Price" for each:
   
   £3 Suggested:
   ├── Amount: £3.00
   ├── Currency: GBP
   ├── Interval: month
   ├── Name: "Suggested"
   └── Save → Copy Price ID → POLAR_PWYL_PRICE_3
   
   £5 Supporter:
   ├── Amount: £5.00
   ├── Currency: GBP
   ├── Interval: month
   ├── Name: "Supporter"
   └── Save → Copy Price ID → POLAR_PWYL_PRICE_5
   
   £10 Champion:
   ├── Amount: £10.00
   ├── Currency: GBP
   ├── Interval: month
   ├── Name: "Champion"
   └── Save → Copy Price ID → POLAR_PWYL_PRICE_10
   ```

3. **Configure Checkout**:
   - Currency is inherited from price
   - Polar automatically uses GBP when price is in GBP
   - Payment methods: Card (via Stripe)
   - Stripe will charge in GBP

### Verifying GBP in Checkout

**Test checklist**:
- [ ] Polar checkout page shows "£" symbol (not "$")
- [ ] Payment input shows "GBP" currency code
- [ ] Test card charge appears in GBP in Polar dashboard
- [ ] Webhook data includes `price_currency: "GBP"`

---

## 🎁 Trial Configuration Guide

### Current PLOT Trial System

**Trial Logic** (already in codebase):
- Trial = first 2 completed pay cycles
- Tracked per household via `paycycles.status`
- Free tier limits don't apply during trial (unlimited pots)
- After 2 cycles → Free tier limits activate OR user upgrades

### Polar Trial Configuration

**Recommended**: **No Polar trial** (trial already managed by PLOT)

**Reasoning**:
1. Users get PLOT's 2-pay-cycle trial first (already implemented)
2. When they upgrade to PWYL → billing starts immediately
3. This avoids confusion and double-trial scenarios

**Polar Product Settings**:
```
Trial Period: 0 days
```

**Alternative** (if you want Polar to also track trial):
```
Trial Period: 60 days

Note: This means:
- User signs up → PLOT trial (2 cycles)
- User upgrades → Polar trial (60 days) starts
- Total trial = 2 PLOT cycles + 60 Polar days
- Might be overly generous
```

### Handling Trial State in UI

**Dashboard**: Show trial progress
```typescript
// components/dashboard/trial-banner.tsx (new)
interface TrialBannerProps {
  cyclesCompleted: number;
  totalTrialCycles: number; // 2
}

// "You've completed 1 of 2 trial pay cycles"
// Progress bar: 50%
// CTA: "Upgrade anytime" (links to /pricing)
```

**Pricing Page**: Show trial-aware messaging
```typescript
// If user is in trial (< 2 cycles completed)
<p>You're currently in your trial. Choose your premium contribution for after your trial ends.</p>

// If trial expired
<p>Your trial has ended. Upgrade to continue with unlimited pots.</p>
```

---

## 📜 Legal Updates Required

### Privacy Policy Updates

**Location**: `apps/marketing/public/privacy.html` (or wherever hosted)

**Sections to Add**:

#### Payment Processing (New Section)
```html
<h3>3. Payment Processing</h3>
<p>
  When you subscribe to PLOT Premium through our pay-what-you-like model, 
  payment processing is handled by Polar (polar.sh), our payment partner. 
  Polar may collect and process:
</p>
<ul>
  <li>Payment card information (processed via Stripe, Polar's payment processor)</li>
  <li>Billing address and email</li>
  <li>Subscription amount and billing frequency</li>
  <li>Transaction history</li>
</ul>
<p>
  We store only:
  - Your subscription status (active, cancelled, etc.)
  - Your chosen contribution amount
  - A reference ID to your Polar subscription
</p>
<p>
  Payment card details are never stored on PLOT servers. For Polar's privacy practices, 
  see <a href="https://polar.sh/legal/privacy">Polar Privacy Policy</a>.
</p>
```

#### Data Retention
```html
<h4>Subscription Data</h4>
<p>
  We retain your subscription information (status, tier, amount) for as long as your account 
  is active and for 7 years after account deletion for legal and financial record-keeping requirements.
</p>
```

### Terms & Conditions Updates

**Location**: `apps/marketing/public/terms.html`

**Sections to Add**:

#### Pay-What-You-Like Subscription Terms
```html
<h3>7. Pay-What-You-Like Subscriptions</h3>

<h4>7.1 Contribution Amount</h4>
<p>
  PLOT Premium uses a pay-what-you-like (PWYL) pricing model. You may choose any monthly 
  contribution amount from £0 to £10. Our suggested contribution is £3 per month.
</p>

<h4>7.2 Free Premium Access (£0 Contribution)</h4>
<p>
  If you choose £0, you will receive Premium features at no cost as a "Community Supporter." 
  PLOT reserves the right to:
  - Limit £0 subscriptions to a trial period (e.g., 6 months)
  - Request payment to continue Premium access after the trial
  - Convert your account to the Free tier if no contribution is made
</p>
<p>
  We will provide 30 days' notice before any change to your £0 Premium access.
</p>

<h4>7.3 Changing Your Contribution</h4>
<p>
  You may change your PWYL contribution amount at any time through Settings → Subscription → Change Amount.
  Changes take effect at the next billing cycle.
</p>

<h4>7.4 Billing</h4>
<p>
  PWYL subscriptions are billed monthly on the date you subscribe. Payment is processed by 
  Polar (polar.sh) via Stripe. You will receive receipts by email.
</p>

<h4>7.5 Cancellation</h4>
<p>
  You may cancel your PWYL subscription at any time. Upon cancellation:
  - Premium features remain active until the end of your current billing period
  - No refunds for partial months
  - Your account will revert to the Free tier after the period ends
</p>

<h4>7.6 Price Changes (Legacy Users)</h4>
<p>
  Users subscribed to legacy fixed-price plans (£4.99/month or £49.99/year) before the 
  introduction of PWYL pricing will maintain their current pricing. You may optionally 
  switch to PWYL pricing by cancelling and resubscribing.
</p>
```

#### Trial Period Terms
```html
<h3>8. Trial Period</h3>

<h4>8.1 PLOT Trial (All Users)</h4>
<p>
  New users receive a trial period of their first two (2) completed pay cycles. During this period:
  - All features are available with no limits
  - No payment is required
  - After 2 pay cycles, your account will transition to the Free tier unless you subscribe to Premium
</p>

<h4>8.2 Trial Duration</h4>
<p>
  Trial duration depends on your pay cycle frequency:
  - Monthly (1st of month): Approximately 60 days
  - Every 4 weeks: Approximately 56 days
  - Last working day: Approximately 58-62 days
</p>

<h4>8.3 One Trial Per Household</h4>
<p>
  The trial is provided once per household. If you delete your account and create a new one 
  with the same household details, the trial will not be re-granted.
</p>
```

### Refund Policy
```html
<h3>9. Refunds</h3>

<h4>9.1 PWYL Subscriptions</h4>
<p>
  Given the flexible nature of our pay-what-you-like pricing:
  - No refunds for monthly contributions (you chose the amount)
  - If you're dissatisfied, you may cancel immediately and pay nothing going forward
  - For payment errors or technical issues, contact hello@plotbudget.com
</p>

<h4>9.2 Exceptional Circumstances</h4>
<p>
  We reserve the right to issue refunds at our discretion for:
  - Technical failures preventing service use
  - Accidental duplicate charges
  - Service unavailability exceeding 72 hours
</p>
```

---

## 🔗 PWYL Links & CTAs

### Locations to Update

1. **Dashboard** (post-trial):
   ```tsx
   // components/dashboard/trial-expired-banner.tsx
   <div className="upgrade-banner">
     <p>Your trial has ended. Choose your contribution to keep premium features:</p>
     <Link href="/pricing">View Pay-What-You-Like Pricing</Link>
   </div>
   ```

2. **Blueprint** (when hitting limits on Free tier):
   ```tsx
   // components/blueprint/limit-reached-message.tsx
   <div className="limit-message">
     <p>You've reached the free tier limit (2 pots).</p>
     <Link href="/pricing">Upgrade with Pay-What-You-Like pricing</Link>
     <p className="text-xs">From £0/month — you choose what to pay</p>
   </div>
   ```

3. **Settings Navigation**:
   ```tsx
   // components/navigation/user-menu.tsx
   // Add menu item
   <DropdownMenuItem asChild>
     <Link href="/pricing">
       <CreditCard className="mr-2 h-4 w-4" />
       <span>Pricing</span>
     </Link>
   </DropdownMenuItem>
   ```

4. **Onboarding Completion**:
   ```tsx
   // After onboarding finishes
   <p>You have 2 pay cycles to try PLOT for free. After that, support us with our 
   pay-what-you-like model — from £0 to £10/month, you decide.</p>
   ```

### CTA Messaging Guidelines

**When to mention PWYL**:
- ✅ Trial expiry banners
- ✅ Free tier limit messages
- ✅ Settings → Subscription tab
- ✅ Onboarding completion
- ✅ Email campaigns

**How to message**:
- ❌ "Upgrade for only £X" (creates price pressure)
- ✅ "Pay what feels fair: £0-£10/month"
- ✅ "Support PLOT development with your chosen amount"
- ✅ "From free to £10 — you decide what PLOT is worth to you"

---

## 🔐 Updated Environment Variables

```bash
# ==========================================
# PRICING CONFIGURATION
# ==========================================

# Master Switches
NEXT_PUBLIC_PRICING_ENABLED=true                    # Show pricing page and subscription features
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true               # Use PWYL model (default for new users)
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false             # Use fixed pricing (legacy users only)

# ==========================================
# POLAR - PWYL PRODUCTS (SANDBOX)
# ==========================================
POLAR_PWYL_BASE_PRODUCT_ID=<uuid>                   # Single PWYL product (all amounts)
POLAR_PWYL_PRICE_3=<uuid>                           # £3/month preset (suggested)
POLAR_PWYL_PRICE_5=<uuid>                           # £5/month preset (supporter)
POLAR_PWYL_PRICE_10=<uuid>                          # £10/month preset (champion)

# ==========================================
# POLAR - FIXED PRODUCTS (LEGACY - HIDDEN)
# ==========================================
POLAR_PREMIUM_PRODUCT_ID=269c7db2-6026-4662-9261-c904be5012d9     # £4.99/month (legacy)
POLAR_PREMIUM_ANNUAL_PRODUCT_ID=879e648f-e969-42e0-807c-7d145c3cb92a  # £49.99/year (legacy)
POLAR_PREMIUM_PRICE_ID=269c7db2-6026-4662-9261-c904be5012d9       # (same as product)
POLAR_PREMIUM_ANNUAL_PRICE_ID=879e648f-e969-42e0-807c-7d145c3cb92a  # (same as annual product)

# ==========================================
# POLAR - SHARED CONFIG
# ==========================================
POLAR_ACCESS_TOKEN=polar_oat_...                    # Sandbox access token
POLAR_WEBHOOK_SECRET=polar_whs_...                  # Webhook signing secret
POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}

# ==========================================
# OTHER FEATURES
# ==========================================
NEXT_PUBLIC_AVATAR_ENABLED=true
NEXT_PUBLIC_SIGNUP_GATED=false
```

---

## 📋 Polar Dashboard Configuration Checklist

### Product Setup (sandbox.polar.sh)

- [ ] Create PWYL Product:
  - [ ] Name: "PLOT Premium (Pay What You Like)"
  - [ ] Currency: GBP
  - [ ] Type: Subscription
  - [ ] Trial: 0 days (PLOT manages trial internally)
  - [ ] Copy Product ID → `POLAR_PWYL_BASE_PRODUCT_ID`

- [ ] Create Preset Prices:
  - [ ] £3/month → Copy ID → `POLAR_PWYL_PRICE_3`
  - [ ] £5/month → Copy ID → `POLAR_PWYL_PRICE_5`
  - [ ] £10/month → Copy ID → `POLAR_PWYL_PRICE_10`

- [ ] Configure Webhook:
  - [ ] URL: `https://YOUR_NGROK.ngrok-free.dev/api/webhooks/polar`
  - [ ] Secret: (generate) → `POLAR_WEBHOOK_SECRET`
  - [ ] Events: subscription.created, subscription.updated, subscription.canceled

- [ ] Generate Access Token:
  - [ ] Scope: All (full access)
  - [ ] Copy token → `POLAR_ACCESS_TOKEN`

### Testing Currency

**Test Checkout Flow**:
1. Create checkout with £3 price: `GET /api/checkout?product=pwyl&amount=3`
2. Verify Polar checkout shows:
   - Currency symbol: £
   - Amount: 3.00
   - Billing: "£3.00 GBP per month"

**Test Custom Amount**:
1. Create checkout with £7.50: `GET /api/checkout?product=pwyl&amount=7.50`
2. If custom prices supported, verify:
   - Dynamic price created in GBP
   - Checkout shows £7.50

---

## 🎯 Refined Implementation Plan

### Scope Adjustments

#### Range: £0-£10 (not £0-£20)
**UI Changes**:
```typescript
// components/pricing/pricing-amount-selector.tsx
<Slider
  min={0}
  max={10}  // Changed from 20
  step={0.5}
  value={[amount]}
  onChange={([v]) => setAmount(v)}
/>

const presets = [
  { amount: 0, label: 'Free' },
  { amount: 3, label: 'Suggested' },
  { amount: 5, label: 'Supporter' },
  { amount: 10, label: 'Champion' },  // Max preset
];
```

**Validation**:
```typescript
// lib/utils/pwyl-pricing.ts
export function validatePWYLAmount(amount: number): ValidationResult {
  if (amount < 0) return { valid: false, error: 'Amount cannot be negative' };
  if (amount > 10) return { valid: false, error: 'Maximum contribution is £10/month' };
  if (amount > 0 && amount < 0.5) {
    // Stripe/Polar minimum
    return { valid: false, error: 'Minimum paid amount is £0.50' };
  }
  return { valid: true };
}
```

### Complete Feature Coverage

**All PWYL-Related Features**:

| Feature | Visible When | Shows |
|---------|--------------|-------|
| Pricing page | PWYL flag ON | PWYL matrix with selector |
| Pricing CTA | Always | "View Pricing" or "Upgrade" |
| Settings → Subscription | PWYL flag ON OR user has PWYL sub | Current plan + amount, manage links |
| Dashboard trial banner | In trial (< 2 cycles) | Trial progress, link to /pricing |
| Limit-reached messages | Free tier, hitting limits | "Upgrade with PWYL from £0" |
| User menu | Logged in | "Pricing" menu item |
| Onboarding completion | After setup | Trial info + PWYL mention |

**Conditional Rendering Logic**:
```typescript
// Show PWYL-specific content if:
const showPWYL = 
  getPWYLPricingEnabledFromEnv() || 
  (subscription?.pricing_mode === 'pwyl');

// Show fixed pricing if:
const showFixed = 
  getFixedPricingEnabledFromEnv() || 
  (subscription?.pricing_mode === 'fixed');
```

---

## 🛠️ Implementation File Checklist

### Phase 1: Foundation
- [ ] **lib/feature-flags.ts**: Add PWYL flag functions
- [ ] **lib/utils/pwyl-pricing.ts**: Create validation and helpers
- [ ] **.env.local**: Add PWYL env vars

### Phase 2: Components  
- [ ] **components/pricing/pricing-amount-selector.tsx**: Slider + presets + input (£0-£10)
- [ ] **components/pricing/pricing-matrix-pwyl.tsx**: 3-column matrix with amount selector
- [ ] **components/settings/change-amount-dialog.tsx**: Modal to change PWYL amount
- [ ] **components/dashboard/trial-expired-banner.tsx**: Post-trial upgrade CTA

### Phase 3: Routes & Logic
- [ ] **app/pricing/page.tsx**: Conditional matrix rendering (PWYL vs fixed)
- [ ] **app/api/checkout/route.ts**: PWYL amount handling + £0 logic
- [ ] **app/api/webhooks/polar/route.ts**: Extract and store PWYL amount
- [ ] **app/dashboard/page.tsx**: Already has success toast ✅

### Phase 4: Settings & Management
- [ ] **components/settings/subscription-tab.tsx**: Display PWYL amount, change amount button
- [ ] **components/settings/settings-view.tsx**: Already wired ✅
- [ ] **app/dashboard/settings/page.tsx**: Already fetches subscription ✅

### Phase 5: Legal & UX Polish
- [ ] **apps/marketing/public/privacy.html**: Payment processing section
- [ ] **apps/marketing/public/terms.html**: PWYL subscription terms
- [ ] **components/navigation/user-menu.tsx**: Add "Pricing" link
- [ ] **components/dashboard/dashboard-client.tsx**: Add trial banner when expired

### Phase 6: Testing & Deployment
- [ ] Test £0, £3, £5, £7.50, £10 amounts
- [ ] Test change amount flow
- [ ] Test currency displays as GBP throughout
- [ ] Verify trial logic doesn't conflict with Polar
- [ ] Production deployment with flags

---

## 💡 Implementation Tips

### £0 Subscription Handling

**Simplest Approach**:
```typescript
// app/api/checkout/route.ts
if (amountInPence === 0) {
  // Skip Polar entirely
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.redirect('/login', 302);
  
  const householdId = req.nextUrl.searchParams.get('household_id');
  if (!householdId) return NextResponse.json({ error: 'Missing household_id' }, { status: 400 });
  
  // Create "local" subscription (no Polar)
  await supabase.from('subscriptions').insert({
    household_id: householdId,
    polar_subscription_id: `local_free_${householdId}_${Date.now()}`,
    status: 'active',
    current_tier: 'pro',
    polar_product_id: 'pwyl_free',
    pwyl_amount_gbp: 0,
  });
  
  // Update user tier
  await supabase.from('users')
    .update({ subscription_tier: 'pro', subscription_status: 'active' })
    .eq('id', user.id);
  
  return NextResponse.redirect('/dashboard?upgrade=success', 302);
}
```

### Changing PWYL Amount

**User Flow**:
1. Settings → Subscription → "Change Amount"
2. Opens modal with amount selector (current amount pre-selected)
3. User selects new amount (e.g., £5 → £8)
4. Clicks "Update"
5. Creates new checkout: `/api/checkout?product=pwyl&amount=8&action=update_amount&current_sub_id=XXX`
6. Polar creates new subscription, cancels old one
7. Webhook processes new subscription
8. Success message: "Your contribution has been updated to £8/month"

**Backend**:
```typescript
// In checkout route, when action=update_amount
const currentSubId = req.nextUrl.searchParams.get('current_sub_id');

// After creating new subscription, cancel old one
if (currentSubId && checkout.subscription_id) {
  // Via webhook or direct API call
  await polar.subscriptions.cancel(currentSubId);
}
```

---

## 🎨 Design Refinements

### Amount Selector Visual Design

**Slider Styling**:
```css
/* Gradient fill based on amount */
/* £0: Gray | £3: Green | £5: Blue | £10: Gold */
background: linear-gradient(
  to right,
  #94a3b8 0%,     /* £0 - gray */
  #10b981 30%,    /* £3 - green (suggested) */
  #3b82f6 50%,    /* £5 - blue */
  #f59e0b 100%    /* £10 - gold */
);
```

**Preset Button States**:
- Default: Border outline
- Selected: Filled primary color
- Suggested (£3): Ring effect to draw attention
- Hover: Slight scale transform

### Messaging Tone

**Amount-Based Messages**:
```typescript
const messages = {
  0: "Every user helps us improve PLOT — thank you for being here! 🌱",
  0.5-2.99: "Every bit counts — we're grateful for your support! 💚",
  3: "Our suggested amount — thank you for fair support! ⭐",
  3.01-4.99: "Above and beyond — you're making PLOT better! 🎉",
  5-10: "Wow! Your generosity helps us build something special! 🚀",
};
```

**Principle**: Grateful, never guilt-inducing. Even £0 users should feel welcome.

---

## 🚀 Rollout Strategy

### Week 1: Build & Test (Sandbox)
- Implement all components
- Test with sandbox Polar
- Verify GBP currency throughout
- Test £0-£10 range

### Week 2: Legal & Polish
- Update privacy policy
- Update terms & conditions
- Add trial banner and CTAs
- UX review and refinement

### Week 3: Production Prep
- Create production Polar products (GBP)
- Set production env vars
- Deploy with `NEXT_PUBLIC_PWYL_PRICING_ENABLED=false`
- Smoke test in production

### Week 4: Soft Launch
- Enable PWYL for 10% of users (via PostHog flag)
- Monitor conversion rates
- Track average PWYL amount
- Gather user feedback

### Week 5: Full Launch
- Enable PWYL for all new users
- Keep fixed pricing for existing subscribers
- Monitor analytics
- Iterate on messaging

---

## 📊 Success Metrics

**Track These KPIs**:
1. **Conversion Rate**: % of trial users who upgrade to PWYL
2. **Average Contribution**: Mean £ amount chosen
3. **Distribution**: How many at each preset vs custom
4. **£0 Users**: % of PWYL subscriptions at £0
5. **ARPU Comparison**: PWYL average vs fixed £4.99
6. **Retention**: Do PWYL subscribers churn less?
7. **Upgrades**: Do users increase their PWYL amount over time?

**Target Baselines**:
- Average PWYL amount: £3-£4 (vs £4.99 fixed)
- Conversion rate: 10-15% (vs 5-8% typical for fixed SaaS)
- £0 subscribers: <30% (if higher, add trial limit for £0)
- Monthly revenue: Should match or exceed fixed pricing revenue

---

## 🔄 Future Enhancements

### Post-Launch Features

1. **PWYL Amount Reminders**: Email after 3 months: "Still happy with £3/month?"
2. **Contribution Tiers**: Badging (Community, Supporter, Champion) based on amount
3. **Annual PWYL**: Option for "pay yearly" at 10x monthly rate
4. **One-Time Contributions**: Separate from subscription (tips/donations)
5. **Gifting**: "Pay for someone else's PLOT Premium"

### Analytics Dashboard (Internal)
- Distribution chart of PWYL amounts
- Conversion funnel: Trial → Free → PWYL
- Monthly recurring revenue (MRR) tracking
- Churn analysis by PWYL amount tier

---

## ✅ Final Implementation Checklist

### Polar Configuration
- [ ] Create PWYL product in sandbox (GBP currency)
- [ ] Create 3 preset prices (£3, £5, £10 in GBP)
- [ ] Test custom price creation API
- [ ] Configure webhook endpoint
- [ ] Test with test card 4242 4242 4242 4242
- [ ] Verify all charges show in GBP

### Code Implementation
- [ ] Add PWYL feature flags
- [ ] Create amount selector component
- [ ] Create PWYL matrix component
- [ ] Update checkout route for PWYL
- [ ] Handle £0 subscriptions (skip Polar)
- [ ] Update webhook for PWYL metadata
- [ ] Add change-amount dialog
- [ ] Wire Settings subscription tab

### User Experience
- [ ] Add trial banner to dashboard
- [ ] Update limit-reached messages with PWYL CTAs
- [ ] Add "Pricing" to user menu
- [ ] Test complete user journey: signup → trial → upgrade → manage
- [ ] Verify success toast after checkout
- [ ] Test subscription tab display

### Legal & Compliance
- [ ] Update privacy policy (payment processing section)
- [ ] Update terms & conditions (PWYL subscription terms)
- [ ] Add refund policy for PWYL
- [ ] Review with legal (if applicable)

### Testing
- [ ] Test £0 (free premium grant)
- [ ] Test £3, £5, £10 (presets)
- [ ] Test £7.50 (custom, if supported)
- [ ] Test change amount flow
- [ ] Test trial → upgrade flow
- [ ] Verify all GBP throughout
- [ ] Test webhook processing

### Production
- [ ] Create PWYL product in production Polar (GBP)
- [ ] Set production env vars
- [ ] Deploy code
- [ ] Test with real card (small amount)
- [ ] Enable PWYL flag
- [ ] Monitor first conversions

---

**Ready to proceed with implementation?** The plan is complete and addresses all your requirements: £0-£10 range, GBP configuration, complete user journey, trial setup, and legal updates.
