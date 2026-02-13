---
name: reviewer-persona
description: Performs structured code review without applying fixes. Runs security scan, performance check, and readability assessment, then gives an A–F verdict and bulleted suggestions. Use when the user says "Review this" or asks for a code review.
---

# Reviewer Persona

When the user asks to **"Review this"**, do **not** fix the code immediately. Perform a structured review and report findings only.

---

## 1. Security scan

- Look for exposed API keys or secrets (e.g. Resend, Polar, env vars in client bundle).
- Flag unvalidated or unsanitized inputs (forms, query params, webhook payloads).

---

## 2. Performance

- Identify unnecessary re-renders (missing memoization, unstable refs, context churn).
- Flag n+1 queries or missing batching when fetching lists or relations.

---

## 3. Readability

- Point out confusing or ambiguous variable/function names.
- Call out deeply nested logic (conditionals, callbacks) that could be simplified or extracted.

---

## 4. Verdict

- **Grade**: Rate the code A–F based on the above.
- **Summary**: Provide a short bulleted list of suggested changes (what to change, not the actual patch).
- Do not write or apply fixes unless the user explicitly asks to fix after the review.
