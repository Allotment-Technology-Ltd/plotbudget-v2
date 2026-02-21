# PLOT Calm Design Rules
## Derived from Calm Design Lab (calmdesignlab.com)

This document defines PLOT's Calm Design mandate. Every UI, interaction, notification, copy choice, and feature decision must be evaluated against these rules. These principles are not aesthetic guidelines — they are ethical commitments that align with PLOT's core positioning as a privacy-first, anti-surveillance, 20-minutes-monthly household OS.

---

## The Core Thesis

> "Good design calms. It does not capture — it accompanies."

The attention economy extracts. PLOT restores. Every screen, every notification, every micro-interaction is either pulling the couple deeper into an app loop they didn't ask for, or returning them to their life with the thing done. We choose the latter, always.

PLOT is not building for engagement. PLOT is building for **completion**.

---

## The 10 Calm Design Rules for PLOT

---

### Rule 1: Design for Intention, Not Attention

**Source:** *From Attention to Intention: Designing for What Matters*

The attention economy maximises time-in-app. PLOT measures success by time-to-done. Every feature exists to help couples complete a household task and leave — not to keep them scrolling.

**In practice:**
- No infinite scroll anywhere in the product
- No engagement streaks or "you haven't checked in" guilt mechanics
- Dashboard shows status summaries, not feeds that reward browsing
- Success metrics: ceremony completion rate, not DAU or session length
- Every screen should have a clear exit. If you can't answer "what does the user do when they're done here?" — the screen is broken.

**Anti-pattern to avoid:** Adding a "recent activity" feed, transaction history browsing, or any pattern that rewards passive consumption.

---

### Rule 2: Friction is a Feature, Not a Bug

**Source:** *The Case for Friction*

Modern apps remove all resistance to increase usage. Calm design *curates* friction. Deliberate pauses, confirmation moments, and rituals return users to themselves. PLOT's ceremonies are the primary expression of this principle — they are intentionally not instant.

**In practice:**
- Ceremonies must have a greeting → work → celebration arc. Do not collapse them into a single form.
- The Payday Ritual should feel like a 15-minute event, not a 60-second form
- Use deliberate loading states and transitions during ceremony steps — do not make them feel like rapid-fire data entry
- Confirmation screens before irreversible actions (deleting a seed, closing a pot) are required
- "Save and close" flows should prompt a moment of reflection ("You're all set for this month ✓"), not just redirect silently

**Anti-pattern to avoid:** Designing ceremonies as speed-optimised wizards. They should feel like rituals, not checkout flows.

---

### Rule 3: No Dark Patterns. Ever.

**Source:** *Spot the Deception: A Framework to Avoid Dark Patterns in UX Design*

PLOT's competitive positioning depends entirely on trust. Dark patterns destroy trust. Evaluate every design decision against the five deception vectors:

**Evaluate every screen for:**
- **False urgency:** No countdown timers, no "limited time" messaging unless literally true
- **Attention manipulation:** No autoplay, no infinite scroll, no notification spam
- **Misleading visuals/language:** CTAs say exactly what happens (not "Get started" when it means "Begin 14-day trial")
- **Subscription traps:** Cancellation must be as easy as sign-up. No hidden steps.
- **Privacy manipulation:** Privacy settings must be prominent, plain-language, and default to privacy-protective

**Founding member model specific:** The pay-what-you-like model must be genuinely open. No pre-filled high amounts, no guilt messaging around lower amounts, no "are you sure?" when selecting £0.

---

### Rule 4: Notifications are Nudges, Not Interruptions

**Source:** *Subtle Nudges: How to Design Notifications That Respect User Attention*

PLOT has push notification capability. This is a privilege, not a right. Every notification sent must pass the nudge test: would this feel like a thoughtful reminder from a trusted friend, or an interruption from an app trying to pull you back in?

**Notification rules:**
- Maximum 1 notification per paycycle per user — the payday reminder
- No "we miss you" re-engagement notifications. Ever.
- No notifications for partner activity (e.g. "Your partner updated a seed") unless the user explicitly opts into this
- Notification copy must be specific and actionable: "Payday tomorrow — your ritual takes 15 minutes" not "Don't forget to check PLOT"
- Respect circadian rhythms: notifications must only fire between 08:00–20:00 local time
- Users can disable all notifications and the app must remain fully functional

**Anti-pattern to avoid:** Notification creep — starting with one justified notification type and gradually adding more "helpful" ones over time.

---

### Rule 5: Support the User's Rhythm, Not Ours

**Source:** *The Calm Design Approach: Prioritizing Presence Over Distraction*

PLOT is built around natural household rhythms — payday, weekly reset, quarterly review. These are the user's rhythms, not arbitrary app-imposed schedules. Design must reinforce the user's own cadence, not override it with PLOT's preferred engagement pattern.

**In practice:**
- Paycycle configuration is set by the user — PLOT never suggests they change it to something more "optimised"
- The dashboard adapts its state (pre-payday / post-payday / mid-cycle) based on where the user is in their cycle
- Do not send mid-cycle prompts unless a user has explicitly requested reminders
- Seasonal and life-event awareness (holidays module, kids module) ties to *their* calendar, not a generic one
- "20 minutes monthly" is a promise. If a core flow takes longer than that, it's broken.

---

### Rule 6: Clarity Over Completeness

**Source:** *Types of Attention: Designing Calm in a Distracting World* + *Notes on Calm: A Field Guide for Designing Presence*

The brain has limited attention. Cognitive overload produces anxiety, not engagement. PLOT deals with money — an inherently anxiety-inducing domain. Every screen must carry only what is needed for that moment.

**In practice:**
- Dashboard shows 3–5 key numbers only. Not everything all at once.
- Progressive disclosure: advanced settings are buried appropriately; default views are simple
- Empty states are calm and orienting ("Nothing here yet — your pots will appear after your first Payday Ritual"), not panicked ("You haven't set up anything!")
- Financial data uses JetBrains Mono for instant visual parsing — never mix financial numbers with body text
- Information hierarchy: one primary action per screen. Secondary actions are visually subordinate.

**Colour and visual calm:**
- The module colour system must be used consistently — colour carries meaning (module identity), not mood manipulation
- Do not use red for routine negative states (e.g. a pot below target). Reserve red/warning states for genuine errors.
- Use whitespace aggressively. Empty space is not wasted space.

---

### Rule 7: Ceremonies as Care

**Source:** *Designing as Care* + *The Case for Friction*

PLOT's ceremonies (Payday Ritual, Weekly Reset, Quarterly Review, module onboardings) are acts of care — between partners, and between the product and the user. They are not features. They are the product.

**Ceremony design rules:**
- Every ceremony must have a greeting that acknowledges the moment: "It's payday. Let's sort the month out together."
- Progress must be visible but not pressuring — a step indicator is fine, a countdown timer is not
- Celebration steps must be genuine, not hollow. "You've allocated £3,200 across 8 seeds. That's your whole budget — done." is better than "🎉 Great job!"
- Ceremonies are interruptible and resumable. Life happens. Never lose data on exit.
- The couple's joint participation should be acknowledged where possible ("You and [partner] have completed 6 rituals together")

---

### Rule 8: Autonomy is Non-Negotiable

**Source:** *Is Calm Design a Political Act?* + *The Calm Design Approach*

PLOT's "privacy over profit" principle is a Calm Design principle in disguise. Surveillance capitalism extracts attention and data. PLOT gives both back. Every feature must respect user autonomy.

**In practice:**
- No bank connections, ever — this is a product decision that must never be revisited for growth purposes
- Users can export all their data at any time (GDPR compliance is the floor, not the ceiling)
- Account deletion must be a single confirmed action that removes all data
- Partner invitation is opt-in. Neither partner should feel coerced into sharing financial data.
- The "household chancellor" problem is solved by equal visibility, not by one partner being administrator

---

### Rule 9: Design for Neurodivergent and Anxious Users

**Source:** *Designing Calm for Neurodivergent Minds*

Money causes anxiety for most people. For neurodivergent users, poorly designed financial interfaces can be actively harmful. PLOT must be designed for the most anxious user in the room.

**In practice:**
- `prefers-reduced-motion` must be respected across all animations and transitions
- No surprise modals or unexpected state changes
- Error messages are non-shaming: "That didn't work — try again" not "Invalid input"
- Loading states are always present for async operations — never leave a screen blank or frozen
- Sensory considerations: no flashing, no autoplaying media, no sounds unless user-initiated
- All WCAG 2.2 AA requirements are the baseline. Calm design asks for more — sufficient contrast ratios for stress-reading conditions, clear focus states for keyboard navigation

---

### Rule 10: Measure Calm, Not Engagement

**Source:** *Calm KPIs: Measuring Calm in Design*

What gets measured gets designed for. If PLOT tracks DAU, session length, and notification open rates — it will unconsciously design to improve those metrics. PLOT must track **calm KPIs** instead.

**Calm KPIs for PLOT:**
- **Ritual completion rate**: % of users who complete the Payday Ritual each cycle (target: >80%)
- **Time-to-done**: How long ceremonies actually take (target: Payday Ritual ≤15 min)
- **Notification opt-out rate**: If >20% of users disable notifications, our notifications are spam
- **Support contacts about anxiety/confusion**: Qualitative signal on overwhelm
- **Voluntary return rate**: Users who come back monthly without being re-engaged by notifications
- **Partner joint ritual rate**: % of households where both partners participated in a ritual

**Anti-metrics to never optimise for:**
- Daily active users
- Average session length
- Notification open rates
- Feature discovery rate (not every user needs every feature)

---

## Anti-Patterns Reference

Quick checklist. If any of these appear in a design, flag it immediately:

| Pattern | Why It Violates Calm Design |
|---|---|
| Infinite scroll or feed | Rewards passive browsing, no completion state |
| Engagement streak ("Day 7!") | Creates guilt-driven engagement, not value-driven |
| Countdown timers on offers | False urgency, manipulative |
| "We miss you" notifications | Re-engagement spam, not care |
| Pre-checked upsell options | Consent manipulation |
| Red for routine negative states | Unnecessary anxiety trigger |
| Onboarding that skips the greeting | Breaks ceremony arc, feels transactional |
| Settings buried behind 3+ taps | Autonomy violation |
| Unsaved progress on back navigation | Breaks trust |
| Celebratory empty states ("Start your journey!") | Aspirational over realistic |

---

## How This Aligns with PLOT's Existing Principles

These Calm Design rules are not new constraints — they articulate what PLOT already believes:

- "Privacy over profit" = Rules 3, 7, 8
- "20 minutes monthly, not 5 minutes daily" = Rules 1, 5
- "Partnership without merging" = Rule 8
- "Reality over aspiration" = Rules 3, 6
- "Ceremonies as stories" = Rules 2, 7

Calm Design is PLOT's design philosophy made explicit and actionable.

---

## Usage

**For Claude (project knowledge):** Reference these rules when reviewing UI designs, writing copy, designing notification flows, or evaluating feature additions. Any feature that increases engagement at the cost of user autonomy fails the Calm Design test.

**For Cursor (.cursorrules):** See the extracted rules section below. These rules should be applied during component generation, copy writing, and UX pattern decisions.

---

## Cursor Rules Extract

The following is the condensed version for `.cursorrules` or Cursor's Rules for AI feature:

```
## PLOT Calm Design Rules (from calmdesignlab.com)

PLOT follows Calm Design principles. When generating UI, copy, or interaction patterns:

NEVER:
- Add infinite scroll, engagement streaks, or "time in app" maximising patterns
- Use countdown timers or false urgency language
- Design notifications that function as re-engagement spam
- Use red/warning colours for routine negative financial states
- Pre-check upsell options or hide cancellation flows
- Add features that reward browsing over task completion
- Auto-advance through ceremony steps (let users control pace)

ALWAYS:
- Design ceremonies with greeting → work → celebration arc (never collapse to a single form)
- Include explicit confirmation before destructive actions
- Make notification copy specific and actionable ("Payday tomorrow — your ritual takes 15 minutes")
- Respect prefers-reduced-motion in all animations
- Show a clear primary action per screen — secondary actions are visually subordinate
- Use progressive disclosure: simple defaults, complexity on request
- Write empty states as calm orientation ("Nothing here yet — [X] will appear after [Y]")
- Include data export and deletion as prominent user controls
- Write error messages without shame ("That didn't work — try again")
- Design for completion, not engagement. Every screen needs a clear exit.

MEASURE:
- Ritual completion rate (not DAU)
- Time-to-done (not session length)
- Voluntary return rate (not notification open rate)

PLOT's success is users who spend 15 minutes a month and live their life. Not users who spend 15 minutes a day inside the app.
```
