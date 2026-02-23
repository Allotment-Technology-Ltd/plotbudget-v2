---
name: calm-design
description: Audits and applies PLOT Calm Design principles from Calm Design Lab. Use when reviewing UI/UX against the 10 Calm Design rules, writing copy, designing notifications, or evaluating features for completion vs engagement.
rules: ../../../rules.yaml

# Calm Design (PLOT)
PLOT is a household OS built on the philosophy that couples spend **15 minutes a month** on household admin — not 15 minutes a day in the app. Calm Design mandates designing for **completion** and **intention**, not engagement and attention extraction.
## The 10 Rules (audit checklist)
1. **Design for Intention, Not Attention** — No feeds that reward browsing; no DAU/streak metrics; every screen has a clear "done" exit; dashboard ≤5 key data points or progressive disclosure.
2. **Friction is a Feature** — Ceremonies have greeting → work → celebration; destructive actions have confirmation; success states get a moment of acknowledgement; no silent redirects.
3. **No Dark Patterns** — No false urgency; CTAs match action; no pre-checked upsells; cancellation ≤ signup complexity; privacy within 2 taps.
4. **Notifications are Nudges** — Only payday reminder by default; no "we miss you"; 08:00–20:00 local; no partner-activity notifications without opt-in; no frequency creep.
5. **Support the User's Rhythm** — No mid-cycle nudges unless requested; dashboard adapts to paycycle phase; never suggest changing paycycle config.
6. **Clarity Over Completeness** — ≤5 primary data points or progressive disclosure; calm empty states; no red for routine negative states; financial numbers in JetBrains Mono; one dominant primary action per screen.
7. **Ceremonies as Care** — Greeting step, celebration step; interruptible/resumable with data preserved; progress for orientation not pressure; specific celebration copy (e.g. "You've allocated £X across Y seeds").
8. **Autonomy is Non-Negotiable** — No bank connections; data export ≤2 steps; account deletion: confirm → delete → done; no partner data change without consent; analytics only with explicit opt-in.
9. **Design for Neurodivergent and Anxious Users** — `prefers-reduced-motion` respected; no surprise modals; loading states always visible; forms preserve data on error; no colour-only status; touch targets ≥44px.
10. **Measure Calm, Not Engagement** — No DAU/session-length/engagement as success metrics; no A/B tests for notification open rate; no re-engagement experiments.
## When auditing
- For each violation: file/component, rule number, one-sentence issue, and specific fix (code or copy).
- After the audit: severity-ranked list (Critical / High / Medium / Low), Calm Design score out of 10 per rule, and single highest-priority fix with full code.
## Reference
- Full spec: `docs/plot-calm-design-rules.md`
- Cursor rule: `.cursor/rules/plot-calm-design.mdc`
