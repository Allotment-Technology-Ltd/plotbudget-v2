# Keeping dependencies and CLIs up to date

This repo uses a mix of **package dependencies** (pnpm) and **external CLIs** (Supabase, Polar, etc.). Automation and manual steps are below.

---

## Automated: Dependabot

**[Dependabot](https://docs.github.com/en/code-security/dependabot)** is configured in `.github/dependabot.yml` and opens PRs for:

| What | Schedule | Notes |
|------|----------|--------|
| **npm (pnpm)** | Weekly (Mondays) | Root and all workspaces; lockfile updated. |
| **GitHub Actions** | Weekly (Mondays) | Workflow actions (e.g. `actions/checkout@v4`, `supabase/setup-cli`). |

Review and merge Dependabot PRs as usual. CI must pass. For npm, run `pnpm install` after merging to refresh the lockfile if Dependabot didn’t.

---

## Package dependencies (pnpm)

- **Check outdated packages:**  
  `pnpm outdated` (from repo root).
- **Update all within semver:**  
  `pnpm update` (respects `package.json` ranges).
- **Interactive upgrade (bump major/minor):**  
  `pnpm update -i` or use Dependabot PRs.

Root `package.json` pins some tools (e.g. `turbo`, `typescript`). Dependabot will suggest bumps; review for breaking changes.

---

## CLIs (not in package.json)

These are installed on your machine or in CI; they are **not** managed by pnpm.

### Supabase CLI

Used for migrations (`supabase db push`) and in the Release workflow (`supabase/setup-cli`).

- **Check version:**  
  `supabase --version`
- **Update (Homebrew):**  
  `brew upgrade supabase`
- **Update (npm):**  
  `npm update -g supabase`
- **Docs:**  
  https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli

CI uses the version from the `supabase/setup-cli` GitHub Action; Dependabot will open PRs when that action is updated.

### Polar CLI

Used for local webhook testing (`polar listen`). Not used in CI.

- **Install/update:**  
  `curl -fsSL https://polar.sh/install.sh | bash`  
  (See Polar docs for the latest install command.)

### Others

- **Vercel:** `npm i -g vercel` or use `npx vercel` (no global install).
- **Playwright:** Installed via pnpm in `apps/web`; update with `pnpm update` in the monorepo.

---

## Quick check script

From the repo root:

```bash
./scripts/check-updates.sh
```

This prints outdated pnpm packages and, if the CLIs are installed, their versions and how to upgrade. It does not install or change anything.

---

## Summary

| Item | How it’s kept up to date |
|------|---------------------------|
| npm (pnpm) packages | Dependabot weekly PRs + `pnpm update` when you want. |
| GitHub Actions | Dependabot weekly PRs. |
| Supabase CLI (local) | Manual: `brew upgrade supabase` (or npm global). |
| Polar CLI | Manual: re-run install script from Polar docs. |
| Node / pnpm | Set in CI and `engines`; upgrade when you’re ready and update workflows. |
