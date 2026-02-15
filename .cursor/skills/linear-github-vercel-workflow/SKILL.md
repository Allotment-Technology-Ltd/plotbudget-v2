---
name: linear-github-vercel-workflow
description: Guides the Linear + GitHub + Cursor + Vercel integration for project-management–code–deploy sync. Use when creating branches from Linear tickets, explaining PR/deploy workflow, setting up Linear autolink or Vercel integration, or when the user asks about Linear, branch naming, or deployment tracking.
---

# Linear + GitHub + Cursor + Vercel Workflow

Ensures project management (Linear), code (GitHub + Cursor), and deployment (Vercel) stay in sync.

## Branch naming (critical for autolink)

- **Format:** `<linear-issue-id>-<short-slug>` (e.g. `PROJ-123-update-login`, `app-101-feature`).
- **Rule:** If the user is working from a Linear ticket, create the branch using that issue ID as the prefix so Linear can detect the branch and autolink PRs.
- **In Cursor:** When implementing a change and the user provides a Linear issue ID (e.g. "working on PROJ-123" or "for app-101"), use: `git checkout -b PROJ-123-short-description` (or the exact ID they gave).
- **In Linear:** User can use "Copy Branch Name" (or Cmd+Shift+.) and paste into Cursor terminal.

## Stage-by-stage workflow

| Stage   | Action                         | Result |
|--------|--------------------------------|--------|
| Planning | Create issue in Linear (e.g. PROJ-123) | — |
| Coding  | In Cursor: `git checkout -b PROJ-123-update-login` | Linear can mark "In Progress" (if integration configured) |
| Pushing | Push branch to GitHub         | Vercel starts preview build |
| Review  | Open PR on GitHub              | Linear moves to "In Review"; Vercel posts preview link on PR |
| Merge   | Merge PR                       | Linear moves to "Done"; Vercel deploys to production |

## Integration setup (reference)

- **Linear ↔ GitHub:** Linear Settings → Integrations → GitHub. Connect org/repos. Enable **Autolink PRs** so branch/PR link to the ticket and status updates (In Review, Done) happen from PR state.
- **Cursor ↔ Linear:** (1) **Linear MCP** — Cursor Settings (Ctrl/Cmd+Shift+J) → MCP → Add new global MCP server; add the Linear server so the agent can create issues and open context from issues inside the IDE. (2) **Linear extension** — Install in Cursor for "Linear: Create Issue" and "Copy Branch Name" flows.
- **Linear MCP config (Cursor):** In MCP settings, add: `{ "mcpServers": { "linear": { "command": "npx", "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"] } } }`
- **Vercel ↔ Linear:** Linear Settings → Integrations → Vercel. Enables preview comments on Linear from Vercel preview URLs; optional: mark "Done" only when Vercel deployment succeeds.

## Audit trail: prompt before building

Before creating a branch or writing code for an implementation, the agent must prompt the user to ensure a Linear ticket exists for the change (see **branch-before-implement** rule). This keeps a clear audit trail from development to project planning. If the user has not already provided an issue ID, ask: confirm a ticket exists and, if so, share the ID for branch naming; if not, suggest creating one in Linear or via "Linear: Create Issue" in Cursor. Do not proceed with implementation until the user responds or explicitly says to skip (e.g. "no Linear").

**Creating tickets:** If the **Linear MCP** is configured in Cursor (see Integration setup), the agent can create issues and open context from issues. If not configured, direct the user to create the ticket in the Linear app or via Cursor command palette → "Linear: Create Issue".

## When to apply

- User mentions a Linear issue ID when starting work → use that ID in the new branch name (no prompt needed).
- User asks to implement something without an issue ID → prompt for Linear ticket and ID first.
- User asks how branch naming works with Linear → use `<issue-id>-<slug>` and point to "Copy Branch Name" in Linear.
- User asks about PR/deploy flow or "golden path" → summarize the stage table and recommend Autolink PRs + Vercel integration.
