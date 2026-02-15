# OKR Metrics (PLOT-82)

Metric definitions, data sources, and update cadence for the 6-month OKR plan. See the full plan in `.cursor/plans/` (PLOT-82 OKR Plan).

---

## Data sources

| Tool | Purpose | Where to view |
|------|---------|----------------|
| **Polar** | Revenue, subscriptions, churn, checkout conversion | polar.sh → Analytics & Revenue |
| **PostHog** | User behaviour, funnel, cohorts | PostHog dashboard (Insights, Funnels, Cohorts) |
| **Vercel** | Page views, Web Vitals (LCP, CLS, INP), referrers | Vercel dashboard → App project (Analytics) |

**Vercel free tier:** Analytics and Web Vitals are enabled for the **App project only** (app.plotbudget.com). Marketing site uses PostHog or GA4.

---

## PostHog events (implemented)

| Event | When | Properties |
|-------|------|------------|
| `user_signed_up` | After successful email signup | `method`, `referrer` |
| `user_identified` | After login (via PostHogIdentifyOnAuth) | — |
| `trial_started` | First pay cycle created (onboarding) | `household_id` |
| `payday_ritual_completed` | User closes cycle ritual | `cycle_id`, `household_id` |
| `partner_invite_sent` | Invite sent (email or link) | `household_id`, optional `link_only`, `resend`, `send_to_email` |
| `partner_invite_accepted` | Partner accepts invite | `household_id` |
| `pricing_page_viewed` | User views /pricing | `source` |
| `checkout_started` | User clicks Premium CTA to checkout | `amount`, `pricing_mode` |
| `subscription_started` | Polar webhook: subscription created/active | `amount`, `tier`, `polar_subscription_id`, `household_id` |
| `subscription_cancelled` | Polar webhook: subscription canceled/revoked | `tier`, `polar_subscription_id`, `household_id` |

---

## CFO metrics (Polar + PostHog)

| Metric | Definition | Source |
|--------|------------|--------|
| MRR | Sum of active subscription revenue | Polar dashboard |
| Active subscriptions | Count of paying households | Polar dashboard |
| ARPU | MRR / paying households | Derived from Polar |
| PWYL amount distribution | Histogram of chosen amounts | Polar (checkout metadata) |
| Trial → Paid | % trial users who subscribe | PostHog: `subscription_started` / `trial_started` |
| Churn rate | % cancelling per month | Polar (subscription.canceled) |
| CAC | Marketing spend / new signups | Manual (spend / PostHog signups) |

---

## CMO funnel

1. **Visit** → Vercel / PostHog page view  
2. **Signup** → `user_signed_up`  
3. **Trial start** → `trial_started`  
4. **First ritual** → `payday_ritual_completed`  
5. **Premium** → `subscription_started` (Polar + PostHog)

Primary conversion goal: **Trial starts**. Secondary: Trial → First ritual → Premium.

---

## Update cadence

- **Weekly:** PostHog funnel (signup → trial → ritual → premium), Polar MRR and subscription count.
- **Monthly:** ARPU, churn, Trial → Paid %, OKR key result check.
- **Ad hoc:** Polar dashboard for failed payments, webhook health; Vercel for Web Vitals and deployment impact.

---

## Implementation checklist (done)

- [x] PostHog `identify()` after login (PostHogIdentifyOnAuth)
- [x] PostHog events: signup, trial, ritual, pricing view, checkout, subscription (client + server)
- [x] Partner invite events (server)
- [x] Vercel Analytics + Speed Insights in App layout
- [x] Polar as source of truth for revenue; webhook syncs subscription events to PostHog

Enable **Vercel Analytics** for the App project in the Vercel dashboard if not already on. Create PostHog dashboards for funnel and cohorts as needed.
