# Supabase Dashboard Migrations

Run these in **Supabase Dashboard → SQL Editor** in order. Paste each file’s contents into a new query and run it.

1. **01_base_schema.sql** – Enums, tables, indexes, triggers (including `handle_new_user` for signup). Use on a **new** project; skip if the project already has these tables.
2. **02_partner_invitation.sql** – Partner invitation columns on `households`. Safe to run if columns already exist (uses `IF NOT EXISTS`).
3. **03_rls_policies.sql** – Row Level Security policies. Idempotent (drops existing policies then recreates).

**Order:** Run 01 → 02 → 03. For an existing project that already has the base schema, run only 02 and 03.
