# Privacy & Data Governance

This document defines how PLOT handles personal data so we meet UK GDPR and exceed typical app standards. It supports [OPEN-BANKING-READINESS.md](./OPEN-BANKING-READINESS.md) for any future bank integrations (TrueLayer, Plaid, Tink).

---

## 1. Principles

- **Data minimisation** – Collect and keep only what is necessary for the product and legal obligations.
- **Purpose limitation** – Use data only for stated purposes (service delivery, security, legal).
- **Transparency** – Privacy policy and in-app controls (export, delete) are clear and available.
- **Security by design** – Access control (RLS), audit logging, encryption in transit and at rest, rate limiting.
- **User rights** – Access, rectification, erasure, portability, restriction, objection, and complaint (ICO) as per UK GDPR.

---

## 2. Lawful Basis

| Data / purpose | Lawful basis | Notes |
|----------------|--------------|--------|
| Account (email, password, profile) | Contract | Necessary to perform the service. |
| Budget data (income, pots, seeds, repayments, paycycles) | Contract | Core service data. |
| Partner/household linkage | Contract | Required for shared budget feature. |
| Transactional emails (password reset, invites) | Contract / Legitimate interest | Service operation. |
| Product analytics (PostHog) | Legitimate interest | Improve product; no sale of data; minimal PII. |
| Waitlist (marketing site) | Consent | Explicit sign-up to mailing list. |
| Security and audit logs | Legitimate interest | Security, fraud prevention, compliance. Logs kept minimal (e.g. user id, event type, timestamp); no sensitive payloads. |

When we add open banking, consent will be obtained explicitly for linking bank accounts and we will record scope and timestamp (see OPEN-BANKING-READINESS.md).

---

## 3. Retention

| Data | Retention | Rationale |
|------|-----------|-----------|
| Account and budget data | Until account deletion | Required for service. |
| Audit events | 24 months (configurable) | Security and compliance; then delete or anonymise. |
| Supabase Auth (sessions) | Per Supabase; we do not extend beyond account lifecycle | Tied to account. |
| Transactional email logs | Per Resend policy | Operational. |
| PostHog | Per PostHog config; we minimise PII | Product analytics. |
| Waitlist (MailerLite) | Until unsubscribe or request | Consent-based. |

On account deletion we remove or anonymise all linked data as described in the app (delete account flow) and in the privacy policy. Audit events for the deleted user can be retained in anonymised form (e.g. user_id set to null, event_type and timestamp kept) for the retention period if required for compliance.

---

## 4. Security and Access

- **Access control** – Row Level Security (RLS) ensures users see only their household data. Service role is used only server-side for admin operations (e.g. cron, webhooks).
- **Audit trail** – Security-relevant events (login, logout, password change, account deletion, data export, partner invite/revoke) are written to `audit_events` with user id, event type, and timestamp (no passwords or tokens).
- **Secrets** – All API keys and tokens are server-side (env vars or secure storage). No secrets in client bundle or logs.
- **Encryption** – Supabase provides encryption at rest and in transit. We enforce HTTPS and HSTS.

---

## 5. User Rights (UK GDPR)

- **Access** – User can export their data (CSV) from Settings → Privacy.
- **Erasure** – User can delete their account and all associated data from Settings → Danger Zone.
- **Portability** – Export is CSV; machine-readable and usable elsewhere.
- **Rectification** – User can update profile and budget data in the app.
- **Restriction / objection** – Handled case-by-case; contact hello@plotbudget.com.
- **Complaint** – Users can lodge a complaint with the [ICO](https://ico.org.uk/). We respond to requests within 30 days.

---

## 6. Open Banking (Future)

If we integrate with TrueLayer, Plaid, Tink or similar:

- **Consent** – Explicit consent for linking accounts and specified data scope; stored with timestamp.
- **Minimisation** – Only store bank-derived data needed for the product; define retention (e.g. 90 days for transaction snapshots unless longer is justified).
- **Deletion** – On account deletion or consent withdrawal, revoke provider tokens and delete or anonymise all open-banking-derived data.
- **No sale** – We do not sell or share bank or budget data for advertising or third-party marketing.

---

## 7. References

- [UK GDPR](https://www.gov.uk/data-protection)
- [ICO Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/)
- [NCSC Application Security](https://www.ncsc.gov.uk/guidance/application-security)
- [OPEN-BANKING-READINESS.md](./OPEN-BANKING-READINESS.md)
- [SECURITY-REVIEW.md](./SECURITY-REVIEW.md)
