---
name: saas-engineering-standards
description: Guides full-stack SaaS development with a planning-first protocol, TypeScript/React/Tailwind standards, and tooling rules for Polar, PostHog, and Resend. Use when building or modifying SaaS features, subscriptions, analytics, or emails, or when the user requests planning-before-code or SaaS best practices.
rules: ../../../rules.yaml

# Senior SaaS Engineer Standards
Follow these standards for profitable, scalable SaaS: clean architecture, type safety, and user-centric development.
## 1. Planning Protocol (run first for complex requests)
Adopt "Measure Twice, Cut Once" before writing code:
1. **Exploration**: Briefly map the files and areas you need to touch.
2. **Pseudo-code**: Write a high-level plan or pseudo-code in a markdown block.
3. **Confirmation**: Ask the user to confirm the plan before generating code.
Skip only for trivial, single-file changes.
## 2. Tech Stack Standards
| Area | Standard |
|------|----------|
| **Language** | TypeScript strict mode. No `any`; use `unknown` or generics when types are dynamic. |
| **Styling** | Tailwind CSS. Use `clsx` or `tailwind-merge` for conditional class logic. |
| **Components** | React functional components. Prefer composition over inheritance. |
| **State** | Prefer server state (React Query / SWR) over global client state (Zustand / Redux) unless client-only state is clearly required. |
## 3. Tooling Standards
### Polar (monetization)
- **Subscription-first**: Protect routes by checking subscription status on the server (Edge/Node) before rendering client components.
- **Webhooks**: Always verify webhook signatures to prevent spoofing.
- **Types**: Use official Polar SDK types for Checkout and Subscription. Do not define these manually.
### PostHog (analytics & feature flags)
- **Feature flags**: Wrap new features in PostHog flags. Default flag to `false` for safe rollout.
- **Events**: Use `noun_verb` naming (e.g. `button_clicked`, `subscription_started`) for distinct, searchable events.
- **Identification**: Call `posthog.identify()` immediately after login to link anonymous sessions to the user.
### Resend (email)
- **Templates**: Prefer `@react-email/components` for building emails.
- **Sending**: Send email from background jobs or Next.js API routes; never block the UI thread.
- **Domain**: Assume domain is verified; on errors, check DKIM/SPF first.
## 4. Coding Reflexes
- **No hallucinations**: If a library’s exact API or syntax is uncertain, ask for `@Docs` (or equivalent) instead of guessing.
- **Fail fast**: Use error boundaries and `try/catch` around external calls (Polar, Resend, etc.).
- **Comments**: Explain *why* (business logic, tradeoffs), not *what* (syntax or obvious behavior).
- **Cleanup**: Before finishing, remove unused imports and console logs from modified files.
