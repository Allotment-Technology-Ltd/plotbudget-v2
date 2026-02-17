# Feedback satisfaction metric (PostHog)

The feedback form captures an optional **satisfaction rating (1–5)** (CSAT-style: 1 = Not at all, 5 = Very satisfied). Submissions are tracked in PostHog so you can monitor the metric over time.

## Event

- **Event name:** `feedback_submitted`
- **Captured:** Server-side when a user successfully submits feedback (dashboard → Feedback & bugs).
- **Properties:**
  - `type` – `"bug"` or `"feedback"`
  - `rating` – number 1–5 (only if the user selected a rating)
  - `category` – for feedback only: `idea` | `something_wrong` | `praise` | `other` (omitted if general)

## Tracking the metric in PostHog

1. **Trend: volume of feedback**
   - **Insight type:** Trends
   - **Event:** `feedback_submitted`
   - **Chart:** Total count over time (day/week/month).

2. **Trend: average satisfaction (CSAT)**
   - **Insight type:** Trends
   - **Event:** `feedback_submitted`
   - **Value:** Property `rating` → **Average**
   - **Chart:** Average rating over time. Filter to `rating` is set if you want to exclude submissions without a rating.

3. **Breakdown by type or category**
   - Add **Breakdown by** `type` or `category` to see satisfaction or volume by feedback type.

4. **Optional: CSAT as a single number**
   - Use a **Number** insight: event `feedback_submitted`, value = average of `rating`, with an optional time range (e.g. last 30 days).

## Notes

- Rating is optional; not every submission will have `rating` set.
- PostHog must be configured (`NEXT_PUBLIC_POSTHOG_KEY`) for server-side capture; otherwise the event is skipped with no error.
