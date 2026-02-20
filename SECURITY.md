# Security

## PLOT's security model

PLOT is a household budgeting app. We take security seriously and design for it explicitly:

- **Authentication & authorization**: We use Supabase (Postgres) with Row Level Security (RLS). Access to data is enforced in the database by policy, not only in application code.
- **Secrets**: Secrets (API keys, database URLs, service role keys) are stored in environment variables and never committed. We use Vercel and GitHub Actions secrets for deployment and CI.
- **Practices**: We follow OWASP guidance where applicable (e.g. input validation, secure headers, no reliance on obscurity).

**Security is not achieved by hiding our code.** We do not depend on the repository being private. We rely on RLS, env vars, and standard security practices so that making the repo public does not weaken our security posture.

## Reporting a vulnerability

If you believe you've found a security vulnerability:

1. **Preferred**: Open a **private** report via GitHub:
   - Go to **Security** → **Advisories** in this repository, then **Report a vulnerability** (or visit `https://github.com/YOUR_ORG/YOUR_REPO/security/advisories` and create a new draft).
   - Click **Report a vulnerability** and submit a draft security advisory. Only maintainers will see it.

2. **Alternative**: Email the maintainers at an address you trust (e.g. from the repository description or organisation profile). Please do **not** open a public issue for sensitive vulnerabilities.

We will acknowledge receipt and aim to respond within a reasonable time. We appreciate responsible disclosure and will credit you if you wish (e.g. in a security advisory or changelog) once the issue is addressed.

## Security settings

- **Repository security features**: [Security overview for this repo](https://docs.github.com/en/code-security/security-overview/about-the-security-overview) (enable Dependabot alerts, code scanning, and private vulnerability reporting if available for your plan).
- **Organisation security**: Configure in your GitHub organisation under **Settings → Code security and analysis**.
