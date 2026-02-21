# PWYL Pricing - Master Implementation Plan

## 📋 Executive Summary

Transform PLOT's pricing from hidden fixed tiers (£4.99/month, £49.99/year) to a visible pay-what-you-like (PWYL) model for new user acquisition.

**Key Requirements**:
- ✅ £0-£10/month range (suggested: £3)
- ✅ GBP currency throughout
- ✅ Complete subscription management UX
- ✅ Trial based on actual pay cycle completions (not time)
- ✅ Email flows for trial transitions and subscriptions
- ✅ Legal updates (privacy policy, T&Cs)

---

## 📚 Documentation Index

| Document | Purpose | Status |
|----------|---------|--------|
| [PWYL-PRICING-PLAN.md](PWYL-PRICING-PLAN.md) | Technical architecture, Polar integration options, component specs | ✅ Complete |
| [PWYL-ARCHITECTURE-DIAGRAM.md](PWYL-ARCHITECTURE-DIAGRAM.md) | Visual diagrams, data flow, component hierarchy | ✅ Complete |
| [PWYL-CONFIGURATION-GUIDE.md](PWYL-CONFIGURATION-GUIDE.md) | Polar setup, GBP config, trial settings, legal updates | ✅ Complete |
| [PWYL-EMAIL-CONFIGURATION.md](PWYL-EMAIL-CONFIGURATION.md) | Email infrastructure, Resend & Polar setup, templates | ✅ Complete |
| [TRIAL-TRANSITION-EMAILS.md](TRIAL-TRANSITION-EMAILS.md) | Complete email sequence for trial → free/premium transition | ✅ Complete |
| [TRIAL-CYCLE-TRACKING.md](TRIAL-CYCLE-TRACKING.md) | Cycle-based triggering system, accurate trial tracking | ✅ Complete |
| [PWYL-IMPLEMENTATION-SUMMARY.md](PWYL-IMPLEMENTATION-SUMMARY.md) | Quick reference, checklists, go-live plan | ✅ Complete |

---

## 🏗️ System Architecture

### Pricing Models

```
┌─────────────────────────────────────────────────────┐
│                   PLOT Pricing                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Feature Flags:                                     │
│  ├── NEXT_PUBLIC_PRICING_ENABLED (master)          │
│  ├── NEXT_PUBLIC_PWYL_PRICING_ENABLED (default)    │
│  └── NEXT_PUBLIC_FIXED_PRICING_ENABLED (legacy)    │
│                                                     │
├─────────────────┬───────────────────────────────────┤
│                 │                                   │
│  PWYL Model     │  Fixed Model (Legacy)             │
│  (New Default)  │  (Hidden by Flag)                 │
│                 │                                   │
│  £0-£10/month   │  £4.99/month                      │
│  User chooses   │  £49.99/year                      │
│  Suggested: £3  │  Fixed prices                     │
│                 │                                   │
│  Presets:       │  Preset products in Polar         │
│  - £0 (skip)    │  269c7db2... (monthly)            │
│  - £3 (ID)      │  879e648f... (annual)             │
│  - £5 (ID)      │                                   │
│  - £10 (ID)     │                                   │
│                 │                                   │
│  Custom: API    │  N/A                              │
│  creates price  │                                   │
│                 │                                   │
└─────────────────┴───────────────────────────────────┘
```

### User Journey: Trial → PWYL

```
Onboarding
    ↓ [Email: Welcome + Trial Info]
    ↓
Pay Cycle 1
    ↓ [Close Ritual]
    ↓ status → 'completed'
    ↓ [Email: Milestone - 1 of 2 complete]
    ↓
Pay Cycle 2 (Active)
    ↓ [end_date in 3 days]
    ↓ [Email: Ending Soon - Choose Plan]
    ↓ [Close Ritual]
    ↓ status → 'completed'
    ↓ trial_cycles_completed = 2
    ↓ [Email: Trial Ended]
    ↓
Decision Point
    ├─→ Reduce to 2 pots → Free Tier ✅
    ├─→ Upgrade PWYL → Premium ✅
    └─→ Do nothing → Grace Period (7 days)
            ↓ Day 6 [Email: Final Reminder]
            ↓ Day 8 → Auto-archive excess pots
            ↓ [Email: Pots Archived + Restore Option]
```

---

## 💡 Key Architectural Decisions

### 1. Trial Tracking: Event-Based, Not Time-Based

**Approach**: Count completed pay cycles via `paycycles.status`
**Benefits**:
- Accurate for all pay schedules
- Respects user's unique cycle dates
- No estimation errors

**Implementation**:
- Database trigger increments `users.trial_cycles_completed` when cycle completes
- Emails triggered on actual cycle events
- Daily cron for "ending soon" warnings (uses actual `end_date`)

### 2. PWYL Pricing: Hybrid Preset + Dynamic

**Approach**:
- Preset prices in Polar (£3, £5, £10) for analytics
- Custom price creation via API for other amounts (if supported)
- £0 subscriptions skip Polar (direct DB write)

**Benefits**:
- Clean Polar dashboard (common amounts)
- Full flexibility (any amount £0-£10)
- Free premium option (£0)

### 3. Currency: GBP Throughout

**Configuration**:
- Polar product currency: GBP
- All prices created in pence (£3 = 300)
- Checkout displays £ symbol
- Receipts in GBP

**Validation**: Test with `price_currency: 'GBP'` in API calls

### 4. Email Strategy: Polar + Resend Hybrid

**Polar handles** (automatic):
- Payment receipts
- Payment failed alerts
- Subscription canceled confirmations

**Resend handles** (custom):
- PWYL-specific welcome messages
- Trial transition emails
- Amount changed notifications
- Grace period warnings

**Sender**: All emails from `hello@app.plotbudget.com`

### 5. Trial in Polar: 0 Days

**Reasoning**:
- PLOT manages trial internally (2 completed cycles)
- Users subscribe AFTER trial expires
- No Polar trial needed (billing starts immediately)

**Setup**: Set trial period to 0 days in Polar product settings

---

## 🛠️ Implementation Components

### New Files to Create

**Components**:
1. `components/pricing/pricing-amount-selector.tsx` - Slider + presets + input (£0-£10)
2. `components/pricing/pricing-matrix-pwyl.tsx` - PWYL version of pricing matrix
3. `components/settings/change-amount-dialog.tsx` - Modal to change PWYL amount
4. `components/dashboard/trial-progress-banner.tsx` - Show trial status
5. `components/dashboard/trial-expired-banner.tsx` - Action required after trial

**Utils & Logic**:
6. `lib/utils/pwyl-pricing.ts` - Validation, preset mapping, formatting
7. `lib/utils/trial-status.ts` - Get trial status for household
8. `lib/actions/tier-enforcement.ts` - Auto-archive logic for free tier
9. `lib/email/subscription.ts` - PWYL subscription emails
10. `lib/email/trial-transition.ts` - Trial email templates

**Email Templates**:
11. `emails/components/email-layout.tsx` - Shared email wrapper
12. `emails/subscription/pwyl-welcome.tsx` - PWYL subscriber welcome
13. `emails/subscription/pwyl-free-welcome.tsx` - £0 subscriber welcome  
14. `emails/subscription/amount-changed.tsx` - Amount update confirmation
15. `emails/trial/milestone.tsx` - 1st cycle complete
16. `emails/trial/ending-soon.tsx` - 2nd cycle ending in 3 days
17. `emails/trial/ended-action-required.tsx` - Trial ended, over limits
18. `emails/trial/grace-reminder.tsx` - Day 6 of grace period
19. `emails/trial/pots-archived.tsx` - After auto-archiving

**Routes & APIs**:
20. `app/api/webhooks/paycycle-completed/route.ts` - Handle cycle completion events
21. `app/api/cron/trial-warnings/route.ts` - Daily check for warnings

**Database**:
22. `supabase/migrations/20250213_trial_tracking.sql` - Trial fields + email log
23. `supabase/migrations/20250213_pwyl_amount.sql` - Optional PWYL amount column

### Files to Modify

24. `lib/feature-flags.ts` - Add PWYL flags
25. `app/pricing/page.tsx` - Conditional matrix rendering
26. `app/api/checkout/route.ts` - PWYL amount handling
27. `app/api/webhooks/polar/route.ts` - Store PWYL amounts, trigger emails
28. `components/settings/subscription-tab.tsx` - Show PWYL amount
29. `components/settings/settings-view.tsx` - Already updated ✅
30. `app/dashboard/page.tsx` - Add trial banners

**Legal Documents**:
31. `apps/marketing/public/privacy.html` - Payment processing section
32. `apps/marketing/public/terms.html` - PWYL subscription terms

---

## 🚀 Implementation Phases

### Phase 1: Foundation & Polar Setup (Week 1)

**Goals**:
- Verify Polar API capabilities
- Set up PWYL products in sandbox
- Configure GBP currency
- Test email sending

**Tasks**:
- [ ] Test Polar custom price creation API
- [ ] Create PWYL product in Polar sandbox (GBP)
- [ ] Create 3 preset prices (£3, £5, £10)
- [ ] Configure Polar emails (hello@app.plotbudget.com)
- [ ] Verify Resend domain (app.plotbudget.com)
- [ ] Add feature flags to codebase
- [ ] Create database migrations (trial tracking, email log)

**Deliverable**: Polar sandbox ready, email infrastructure configured

---

### Phase 2: UI Components (Week 2)

**Goals**:
- Build interactive amount selector
- Create PWYL pricing matrix
- Add trial banners to dashboard

**Tasks**:
- [ ] Build `pricing-amount-selector.tsx` (slider £0-£10, presets, validation)
- [ ] Build `pricing-matrix-pwyl.tsx` (3 columns, embed selector)
- [ ] Build `trial-progress-banner.tsx` (show X of 2 cycles complete)
- [ ] Build `trial-expired-banner.tsx` (action required CTA)
- [ ] Build `change-amount-dialog.tsx` (modal for changing PWYL amount)
- [ ] Update `app/pricing/page.tsx` (conditional rendering)
- [ ] Update `app/dashboard/page.tsx` (add trial banners)

**Deliverable**: Complete PWYL UI visible when flag enabled

---

### Phase 3: Backend Integration (Week 2-3)

**Goals**:
- Handle PWYL checkout flow
- Process £0 subscriptions
- Store PWYL amounts
- Send emails on events

**Tasks**:
- [ ] Update `/api/checkout` route:
  - [ ] Parse `amount` query param
  - [ ] Map to preset price IDs (£3, £5, £10)
  - [ ] Create custom prices for other amounts
  - [ ] Handle £0 (skip Polar, direct DB write)
- [ ] Update webhook handler:
  - [ ] Extract PWYL amount from metadata
  - [ ] Store in subscriptions table
  - [ ] Trigger welcome emails
- [ ] Create email sending utilities:
  - [ ] PWYL welcome (£0 vs paid)
  - [ ] Amount changed
  - [ ] Trial transition emails
- [ ] Create cycle completion webhook:
  - [ ] Increment trial counter
  - [ ] Send milestone emails
  - [ ] Send trial ended emails
- [ ] Create tier enforcement logic:
  - [ ] Auto-archive excess pots after grace period
  - [ ] Send archive notification email

**Deliverable**: End-to-end PWYL flow functional in sandbox

---

### Phase 4: Subscription Management (Week 3)

**Goals**:
- Complete Settings subscription tab
- Enable amount changing
- Add trial info to dashboard

**Tasks**:
- [ ] Update `subscription-tab.tsx`:
  - [ ] Display PWYL amount
  - [ ] Show contribution level (Community/Suggested/Supporter/Champion)
  - [ ] Add "Change Amount" button
  - [ ] Link to Polar portal for cancellation
- [ ] Implement change amount flow:
  - [ ] Modal with amount selector
  - [ ] Create new checkout
  - [ ] Cancel old subscription (via Polar API or manual)
- [ ] Add trial helper function:
  - [ ] `getTrialStatus(householdId)` → cycles completed, is in trial
  - [ ] Use in dashboard to show correct banners

**Deliverable**: Complete subscription self-service

---

### Phase 5: Email Templates & Legal (Week 3-4)

**Goals**:
- Create all email templates
- Update legal documents
- Test email delivery

**Tasks**:
- [ ] Install `@react-email/components`
- [ ] Create email template structure
- [ ] Build 9 email templates (welcome, trial, receipts, etc.)
- [ ] Update privacy policy (payment processing section)
- [ ] Update terms & conditions (PWYL terms, trial terms, refund policy)
- [ ] Configure Polar email branding
- [ ] Test all emails in sandbox

**Deliverable**: Complete email system + legal compliance

---

### Phase 6: Testing & QA (Week 4)

**Goals**:
- Test complete user journeys
- Verify email triggers
- Validate edge cases

**Test Scenarios**:
- [ ] £0 subscription (free premium)
- [ ] £3 preset subscription
- [ ] £7.50 custom subscription  
- [ ] Change amount (£3 → £5)
- [ ] Trial: complete 1 cycle → verify milestone email
- [ ] Trial: complete 2 cycles → verify ended email
- [ ] Grace period: verify reminders + auto-archiving
- [ ] All emails in GBP
- [ ] All emails from hello@app.plotbudget.com

**Deliverable**: Fully tested PWYL system in sandbox

---

### Phase 7: Production Deployment (Week 5)

**Goals**:
- Set up production Polar
- Deploy with flags OFF
- Test in production
- Enable for users

**Tasks**:
- [ ] Create PWYL product in Polar production (GBP)
- [ ] Create preset prices in production
- [ ] Generate production access token
- [ ] Configure production webhook endpoint
- [ ] Set production env vars
- [ ] Deploy code with `NEXT_PUBLIC_PWYL_PRICING_ENABLED=false`
- [ ] Test checkout in production (small amount)
- [ ] Enable flag for 10% of users (PostHog)
- [ ] Monitor conversions and average amount
- [ ] Enable for all users

**Deliverable**: PWYL live in production

---

## 🎯 Critical Path & Blockers

### Must Verify First

**BLOCKER 1**: Polar API Custom Price Creation
```bash
# Test this immediately
curl -X POST https://sandbox-api.polar.sh/v1/checkouts \
  -H "Authorization: Bearer YOUR_SANDBOX_TOKEN" \
  -H "Content-Type": "application/json" \
  -d '{
    "product_price_create": {
      "product_id": "PWYL_PRODUCT_ID",
      "type": "recurring",
      "recurring_interval": "month",
      "price_amount": 750,
      "price_currency": "GBP"
    },
    "success_url": "http://localhost:3000/success"
  }'
```

**If YES**: Full flexibility (£0-£10 range, any amount)
**If NO**: Presets only (create prices for each £1 increment: £0, £1, £2, ..., £10)

**BLOCKER 2**: GBP Currency in Polar
- Verify Polar organization currency can be set to GBP
- Test preset price creation in GBP
- Confirm checkout displays £ symbol

---

## 📊 Feature Comparison

| Feature | Current (Hidden Fixed) | New (PWYL) | Implementation |
|---------|------------------------|------------|----------------|
| **Pricing** | £4.99/mo, £49.99/yr | £0-£10/mo (£3 suggested) | Polar presets + dynamic |
| **Trial** | 2 pay cycles | 2 pay cycles (unchanged) | DB trigger tracking |
| **Currency** | GBP | GBP | Polar product config |
| **Management** | Polar portal only | Portal + in-app amount change | New dialog component |
| **Free Option** | No | Yes (£0) | Skip Polar, DB write |
| **Visibility** | Hidden (flag OFF) | Default (flag ON) | Feature flags |
| **Emails** | Generic Polar | PWYL-specific + gratitude | Resend custom |
| **Legal** | Standard SaaS | PWYL-specific terms | Update HTML docs |

---

## 📧 Email System Architecture

### Email Triggers (Cycle-Based)

| Email | Trigger | Source | Timing |
|-------|---------|--------|--------|
| Welcome | Onboarding complete | Server action | Immediate |
| Milestone | paycycles.status → 'completed' (1st) | DB trigger → Edge fn | Immediate |
| Ending Soon | Active 2nd cycle, end_date in 3 days | Daily cron | 9am UTC |
| Trial Ended | paycycles.status → 'completed' (2nd) | DB trigger → Edge fn | Immediate |
| Grace Day 6 | grace_period_start + 6 days | Daily cron | 9am UTC |
| Archived | After auto-archive script | Script completion | Immediate |
| PWYL Welcome | subscription.created webhook | Polar webhook | Immediate |
| Amount Changed | subscription.updated (price change) | Polar webhook | Immediate |

### Email Providers

**Polar** (transactional):
- Payment receipts (monthly)
- Payment failures
- Subscription cancellations

**Resend** (custom PWYL logic):
- PWYL welcome messages (gratitude-focused)
- Trial transition emails
- Amount changed confirmations
- Grace period warnings

**Sender**: All from `hello@app.plotbudget.com`

---

## 🔧 Environment Variables (Complete)

```bash
# ==========================================
# PRICING FEATURE FLAGS
# ==========================================
NEXT_PUBLIC_PRICING_ENABLED=true                    # Master switch
NEXT_PUBLIC_PWYL_PRICING_ENABLED=true               # Show PWYL (default for new users)
NEXT_PUBLIC_FIXED_PRICING_ENABLED=false             # Show fixed (legacy users only)

# ==========================================
# POLAR - PWYL PRODUCTS (SANDBOX → PRODUCTION)
# ==========================================
POLAR_PWYL_BASE_PRODUCT_ID=<uuid>                   # Single product for all PWYL amounts
POLAR_PWYL_PRICE_3=<uuid>                           # £3/month (suggested)
POLAR_PWYL_PRICE_5=<uuid>                           # £5/month (supporter)
POLAR_PWYL_PRICE_10=<uuid>                          # £10/month (champion)

# ==========================================
# POLAR - FIXED PRODUCTS (LEGACY - KEEP)
# ==========================================
POLAR_PREMIUM_PRODUCT_ID=269c7db2-6026-4662-9261-c904be5012d9
POLAR_PREMIUM_ANNUAL_PRODUCT_ID=879e648f-e969-42e0-807c-7d145c3cb92a
POLAR_PREMIUM_PRICE_ID=269c7db2-6026-4662-9261-c904be5012d9
POLAR_PREMIUM_ANNUAL_PRICE_ID=879e648f-e969-42e0-807c-7d145c3cb92a

# ==========================================
# POLAR - SHARED CONFIG
# ==========================================
POLAR_ACCESS_TOKEN=polar_oat_...                    # Sandbox/production token
POLAR_WEBHOOK_SECRET=polar_whs_...                  # Webhook signing secret
POLAR_SUCCESS_URL=https://app.plotbudget.com/dashboard?checkout_id={CHECKOUT_ID}

# ==========================================
# EMAIL CONFIGURATION
# ==========================================
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=PLOT <hello@app.plotbudget.com>
RESEND_REPLY_TO=hello@plotbudget.com

# ==========================================
# CRON & WEBHOOKS
# ==========================================
CRON_SECRET=<random_secret>                         # For securing cron endpoints
PAYCYCLE_WEBHOOK_SECRET=<random_secret>             # For internal webhooks
```

---

## 📋 Go-Live Checklist

### Pre-Launch

**Polar Configuration**:
- [ ] Create PWYL product (GBP, 0 day trial)
- [ ] Create 3 preset prices (£3, £5, £10 in GBP)
- [ ] Configure webhook (https://app.plotbudget.com/api/webhooks/polar)
- [ ] Configure email sender (hello@app.plotbudget.com)
- [ ] Customize email templates
- [ ] Test checkout flow

**Email Setup**:
- [ ] Verify app.plotbudget.com in Resend
- [ ] Verify app.plotbudget.com in Polar
- [ ] Create all Resend templates
- [ ] Test email delivery
- [ ] Check spam folder placement

**Code Deployment**:
- [ ] All components implemented
- [ ] All routes updated
- [ ] Database migrations run
- [ ] Tests passing
- [ ] Deploy with flags OFF

**Legal**:
- [ ] Privacy policy updated
- [ ] Terms & conditions updated
- [ ] Legal review complete (if required)

### Launch Day

- [ ] Enable `NEXT_PUBLIC_PWYL_PRICING_ENABLED=true` in production
- [ ] Monitor first checkouts
- [ ] Watch webhook delivery logs
- [ ] Check email open rates
- [ ] Monitor database writes

### Post-Launch (Week 1)

- [ ] Track conversion rate (trial → PWYL)
- [ ] Monitor average PWYL amount
- [ ] Check % of £0 subscriptions
- [ ] Gather user feedback
- [ ] Fix any bugs
- [ ] Iterate on email messaging if needed

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Trial → PWYL conversion | >15% | % of trial users who upgrade |
| Average PWYL amount | £3-£4 | AVG(pwyl_amount_gbp) |
| £0 subscriptions | <40% | % choosing £0 |
| Email open rate | >40% | Resend analytics |
| Email click rate (CTA) | >15% | Resend analytics |
| PWYL vs Fixed revenue | >80% | MRR comparison |

**If £0 subscriptions exceed 40%**:
- Consider adding time limit (6 months free premium)
- Adjust messaging to nudge higher amounts
- Test different suggested amounts (£3 → £4?)

---

## ⚠️ Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low ARPU (< £3) | Medium | High | Suggested amount anchors at £3; monitor and adjust |
| High £0 adoption | Medium | Medium | Time-limit £0 premium; send monthly reminders |
| Polar doesn't support custom prices | Low | Medium | Fallback to presets only (still viable) |
| Email deliverability issues | Low | High | Warm up domain; monitor bounce rates |
| Trial tracking bugs | Medium | High | Thorough testing; fallback to time-based |
| User confusion (2 pricing models) | Low | Low | Clear feature flag separation |

---

## 🎉 Expected Outcomes

### Business Impact

**Revenue**:
- Lower barrier to entry (£0 option)
- Higher conversion rate (15% vs 5-8% typical)
- Average £3.50-£4 per user (slightly below £4.99, but more users)
- **Net**: Increased MRR via volume

**User Acquisition**:
- "Pay what you can" removes price objection
- Builds trust and goodwill
- Viral potential ("PLOT let me pay £0!")
- Community-focused brand

**Data Insights**:
- Learn true willingness-to-pay
- Understand price sensitivity
- A/B test suggested amounts
- Identify power users (£10 contributors)

### User Experience

**Benefits**:
- Financial flexibility (pay what you can afford)
- No guilt (£0 is explicitly allowed)
- Easy to upgrade (just change amount)
- Transparent and fair

**Potential Concerns**:
- "Is £0 really allowed?" → Clear messaging needed
- "What's a fair amount?" → Suggested £3 helps
- "Can I change later?" → Yes, emphasize flexibility

---

## 📖 Documentation Summary

**Created 7 comprehensive docs**:

1. **[PWYL-PRICING-PLAN.md](PWYL-PRICING-PLAN.md)** - Technical architecture (Option A vs B, component specs, checkout logic)
2. **[PWYL-ARCHITECTURE-DIAGRAM.md](PWYL-ARCHITECTURE-DIAGRAM.md)** - Visual system design (Mermaid diagrams, data flows)
3. **[PWYL-CONFIGURATION-GUIDE.md](PWYL-CONFIGURATION-GUIDE.md)** - Step-by-step Polar setup (GBP, products, emails, legal)
4. **[PWYL-EMAIL-CONFIGURATION.md](PWYL-EMAIL-CONFIGURATION.md)** - Email infrastructure (Polar + Resend, templates, triggers)
5. **[TRIAL-TRANSITION-EMAILS.md](TRIAL-TRANSITION-EMAILS.md)** - Complete email sequence (6 emails, content, timing)
6. **[TRIAL-CYCLE-TRACKING.md](TRIAL-CYCLE-TRACKING.md)** - Cycle-based triggers (DB schema, edge functions, accuracy)
7. **[PWYL-IMPLEMENTATION-SUMMARY.md](PWYL-IMPLEMENTATION-SUMMARY.md)** - Executive summary (quick reference, checklists)

**Plus existing**:
8. **[POLAR-IMPLEMENTATION.md](POLAR-IMPLEMENTATION.md)** - Fixed pricing implementation (already complete)

---

## 🎬 Next Steps

### Immediate Actions (This Week)

1. **Verify Polar API** - Test custom price creation (BLOCKER)
2. **Create Polar Products** - PWYL product + 3 presets in sandbox (GBP)
3. **Test Email Sending** - Configure Polar/Resend, send test emails

### Implementation Start (Next Week)

4. **Begin Phase 1** - Foundation & setup
5. **Parallel Track** - UI components + backend routes
6. **Continuous** - Testing each component as built

### Go-Live Target

**Estimated Timeline**: 4-5 weeks from start to production

**Dependencies**:
- Polar API capabilities confirmed
- Domain verification complete
- Legal updates approved

---

**The architecture is complete and ready for implementation. All aspects covered: pricing, checkout, webhooks, emails, trial tracking, legal, and user journey.**
