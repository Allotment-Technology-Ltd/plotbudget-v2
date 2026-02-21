# Security findings: Aikido and Dependabot

## Dependabot – ajv ReDoS (resolved)

**Vulnerability:** [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) – ajv ReDoS when using `$data` option.

**Mitigation applied:** Root `package.json` pnpm overrides force patched versions:

- `ajv@6.12.6` → `6.14.0` (eslint chain in `apps/native`)
- `ajv@8.11.0` → `8.18.0` (eas-cli chain in `apps/native`)

After `pnpm install`, `pnpm audit` reports **no known vulnerabilities**. Dependabot may still open a PR to bump direct dependencies; the overrides ensure the transitive ajv instances are patched regardless.

---

## Aikido – 14 problems (addressed)

Aikido runs as the **Aikido PR checks app** on this repo (see `.github/workflows/ci.yml`). The following mitigations were applied for the 14 workspace-scan findings:

| Finding | Location | Mitigation |
|--------|----------|------------|
| Unsafe GitHub Actions trigger | `.github/workflows/ci.yml` | All jobs now run only when `github.event.pull_request.head.repo.full_name == github.repository` (no fork PRs receive secrets). |
| File inclusion | `apps/native/metro.config.js` | Resolved path is checked to be under `projectRoot` or `monorepoRoot` before use. |
| Open redirect | `apps/web/app/auth/callback/route.ts` | Cookie redirect: same-origin check; redirect uses `pathname + search` on request origin only. |
| Open redirect | `apps/web/app/auth/from-app/route.ts` | Already validated via `getSafeRedirectPath` (origin check). |
| Open redirect | `apps/web/proxy.ts` (login/signup redirect param) | Same-origin check; redirect URL built from `pathname + search` on request origin only. |
| SSRF (HTTP request) | `apps/web/hooks/use-events.ts`, `use-tasks.ts` | Client-side relative `fetch()` to same-origin API only; comment added. |
| File inclusion | `apps/web/scripts/audit-test-ids.ts` | `scanFile` accepts `allowedRoot`; path resolved and checked under root before `readFile`. |
| File inclusion | `scripts/code-review.mjs` | Resolved path must be under `process.cwd()` before reading. |
| Generic API key (info) | `docs/CRITICAL-POLAR-API-VERIFICATION.md`, `PWYL-SETUP-GUIDE.md`, `PWYL-EMAIL-CONFIGURATION.md`, `PWYL-MASTER-PLAN.md` | Example tokens replaced with placeholders (e.g. `polar_oat_xxxxxxxx`, `re_xxxxxxxx`). |

**Ongoing:** Re-run the Aikido workspace scan after these changes; any remaining findings can be triaged from the Aikido dashboard or GitHub Security tab.
