# Open Banking Readiness (TrueLayer, Plaid, Tink)

PLOT does not currently connect to banks. This document sets the security, privacy, and technical standards so that **if we pivot to open banking** (TrueLayer, Plaid, Tink, or similar), we meet the bar required by those providers and by regulators (FCA, PSD2, FAPI).

---

## 1. What Open Banking Providers Expect

### 1.1 Security (TrueLayer / Plaid / Tink guidance)

- **No client-side API keys or tokens** – Provider credentials and user access/refresh tokens must never be in the browser. All calls to the provider API must be server-side.
- **Encrypt credentials and tokens** – Stored tokens must be encrypted at rest (provider expectation; Supabase already provides encryption at rest; for extra assurance we can add application-level encryption for token columns).
- **HTTPS only** – All traffic TLS; we already enforce HSTS and serve over HTTPS on Vercel.
- **Audit trail** – Log security-relevant events (consent granted/revoked, token creation/refresh, data access). We implement an `audit_events` table and server-side logging for auth and sensitive actions.
- **Secure session and auth** – Strong auth, httpOnly secure cookies, no privilege escalation. We use Supabase Auth with middleware protection and RLS.

### 1.2 Standards (UK / EU)

- **FAPI (Financial Grade API)** – Open banking APIs often use FAPI 1 Advanced (OAuth 2 / OIDC). When we integrate, we will use the provider’s SDK or a certified OAuth stack and follow their redirect/consent flow; we will not implement our own FAPI from scratch.
- **PSD2 / regulatory** – Only authorised TPPs can call bank APIs. As an app using TrueLayer/Plaid/Tink, we rely on their authorisation; we must still protect user data, obtain consent, and follow our data retention and deletion policies.
- **Consent and scope** – User consent must be explicit and documented. When we add open banking, we will store consent (e.g. consent type, timestamp, scope) and support revocation and data deletion in line with this doc and our privacy policy.

### 1.3 Data and Privacy

- **Minimise bank data** – Store only what’s necessary for the product (e.g. account identifiers, balances or categories if needed). Do not store raw transaction feeds longer than needed.
- **Retention and deletion** – Define retention for open-banking-derived data; on account deletion or consent withdrawal, delete or anonymise in line with [PRIVACY-DATA-GOVERNANCE.md](./PRIVACY-DATA-GOVERNANCE.md).
- **No selling of bank data** – We do not sell or share user data for advertising; this will not change with open banking.

---

## 2. What We Have Today (Pre–Open Banking)

| Area | Status | Notes |
|------|--------|------|
| **Secrets and tokens** | ✅ | No provider keys yet; all secrets server-side (env vars). When we add a provider, credentials and tokens will be server-only and never in client bundle. |
| **HTTPS / HSTS** | ✅ | Enforced in app and marketing; HSTS and CSP in [next.config.js](../apps/web/next.config.js) and [vercel.json](../apps/marketing/vercel.json). |
| **Auth and session** | ✅ | Supabase Auth; httpOnly cookies; middleware protects routes; RLS on all tables. |
| **Audit logging** | ✅ | `audit_events` table and server-side logging for login, logout, password change, account deletion, data export, partner lifecycle. |
| **Rate limiting** | ✅ | Auth and sensitive API routes rate-limited (e.g. by IP) to reduce brute-force and abuse. |
| **Data export / deletion** | ✅ | User can export data (CSV) and delete account; both covered in [PRIVACY-DATA-GOVERNANCE.md](./PRIVACY-DATA-GOVERNANCE.md). |
| **RLS and access control** | ✅ | Row Level Security on all public tables; no cross-household access. |
| **CI security** | ✅ | Dependency audit, code/secret audit, optional Gitleaks/Semgrep as per [SECURITY-REVIEW.md](./SECURITY-REVIEW.md). |

---

## 3. When We Add Open Banking

1. **Provider choice** – Integrate via TrueLayer, Plaid, Tink, or another aggregator; use their SDK/API from **server-only** code (API routes or server actions).
2. **Token storage** – Store access/refresh tokens in the database in a table restricted by RLS; consider application-level encryption for token columns if we need to exceed default-at-rest encryption.
3. **Consent and audit** – Record consent (type, scope, timestamp) and log token creation/refresh and data access in `audit_events` (or a dedicated consent table).
4. **Data minimisation** – Only persist what the product needs; define retention and purge in line with PRIVACY-DATA-GOVERNANCE.
5. **Deletion and revocation** – On account deletion or consent withdrawal, revoke tokens with the provider and delete or anonymise related rows; document in privacy policy and support docs.

---

## 4. References

- [TrueLayer Security](https://truelayer.com/security/)
- [TrueLayer Data API integration](https://docs.truelayer.com/docs/data-api-integration-guide)
- [Plaid Developer Policy](https://plaid.com/developer-policy)
- [Open Banking UK Security Profile](https://standards.openbanking.org.uk/security-profiles/get-started-obl-api-security-profile)
- [FAPI (OpenID)](https://openid.net/specs/openid-connect-financial-api-part1-1_0.html)
