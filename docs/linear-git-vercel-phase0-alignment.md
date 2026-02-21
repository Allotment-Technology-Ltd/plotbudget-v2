# Linear + Git + Vercel alignment for Phase 0 Expansion

Use this checklist so **Linear**, **Git/GitHub**, **Cursor**, and **Vercel** stay in sync for the Phase 0 Platform Foundation + Module Feature Flags work.

## 1. Linear tickets

### Option A — One parent ticket (recommended)

Create **one** Linear issue for the whole Phase 0 scope, e.g.:

- **Title:** `Phase 0 Expansion: Platform Foundation + Module Feature Flags`
- **Description:** Include link to the plan (e.g. `.cursor/plans/phase_0_expansion_and_feature_flags_*.plan.md` or a short summary).
- **Scope:** Module feature flags (env + PostHog), notifications/activity_feed migration, module registry, API routes, Home screen, web sidebar + mobile nav, native 5 tabs + placeholders, module colour design tokens.

**Note the issue ID** (e.g. `PLOT-XXX`). Use it in the branch name below.

### Option B — Parent + sub-issues (granular tracking)

If you want each phase step in Linear:

| Sub-issue title | Covers |
|-----------------|--------|
| 0.1 Migration: notifications + activity_feed | SQL migration, database.types |
| 0.2 Module registry + cross-module types | packages/logic registry |
| 0.3 Notification and activity schemas | Zod schemas in logic |
| 0.4 API routes: notifications + activity-feed | Web API routes |
| 0.5 Home screen + feed client | dashboard/home, smart cards, feed item |
| 0.6 Web module navigation | Sidebar, mobile top bar, bottom nav |
| 0.7 Native tab bar + placeholders | 5 tabs, Money default, home/tasks/calendar/more |
| 0.8 Module colour design tokens | tokens.config, tokens.css, native.ts, tailwind |

Create a **parent** issue (e.g. "Phase 0 Expansion: Platform Foundation + Module Feature Flags") and the above as **sub-issues**. Use the **parent** issue ID for the branch name so one PR links to the parent and Vercel preview is tied to that ticket.

---

## 2. Branch naming and Git

**Format:** `<linear-issue-id>-<short-slug>`

Examples:

- `PLOT-150-phase-0-expansion`
- `PLOT-150-platform-foundation`

**If your work is currently on `main` (uncommitted):**

```bash
# Create branch from current state (includes uncommitted files)
git checkout -b PLOT-XXX-phase-0-expansion

# Commit all Phase 0 work
git add -A
git commit -m "feat(phase-0): platform foundation + module feature flags

- Module feature flags (env + PostHog), turbo.json globalEnv
- Notifications + activity_feed migration and API routes
- Module registry + cross-module types (packages/logic)
- Home screen, smart cards, feed item; web sidebar + mobile nav
- Native 5 tabs (Money default), placeholders for home/tasks/calendar/more
- Module colour design tokens (design-tokens, tailwind)

Ref: PLOT-XXX"

# Push and open PR
git push -u origin PLOT-XXX-phase-0-expansion
```

Replace `PLOT-XXX` with your actual Linear issue ID.

**If you already have a branch** (e.g. `PLOT-132-bottom-sheets`): rename it to match the Phase 0 ticket if that ticket is the one covering this work:

```bash
git branch -m PLOT-132-bottom-sheets PLOT-XXX-phase-0-expansion
git push -u origin PLOT-XXX-phase-0-expansion
# If the old branch existed on remote:
git push origin --delete PLOT-132-bottom-sheets
```

---

## 3. Linear ticket updates

- Set status to **In Progress** when you start (or when the branch is pushed).
- In the ticket description or comments, add:
  - **Branch:** `PLOT-XXX-phase-0-expansion`
  - **PR:** (link after you open the PR)
  - **Vercel preview:** (link from PR or from Linear if Vercel integration is on)

After the PR is opened, Linear’s GitHub integration (Autolink PRs) should link the PR to the ticket and can move the ticket to **In Review**. When the PR is merged, the ticket can move to **Done** and Vercel will deploy from `main`.

---

## 4. Vercel

- Pushing the branch triggers a **preview** deployment.
- Opening a PR shows the preview URL on the PR (and in Linear if the Vercel integration is enabled).
- Merge to `main` triggers **production** deployment.

---

## 5. Quick checklist

- [ ] Linear: Create parent issue (and optionally sub-issues) for Phase 0 Expansion.
- [ ] Note the issue ID (e.g. `PLOT-XXX`).
- [ ] Git: Create or rename branch to `PLOT-XXX-phase-0-expansion` (or your chosen slug).
- [ ] Git: Commit and push; open PR targeting `main`.
- [ ] Linear: Set ticket to In Progress; add branch name and PR link in description.
- [ ] After merge: Linear ticket → Done; Vercel deploys production.

This keeps **Git** (branch + PR), **Cursor** (branch name in terminal), **Linear** (ticket ID in branch + status), and **Vercel** (preview from branch, production from `main`) aligned.
