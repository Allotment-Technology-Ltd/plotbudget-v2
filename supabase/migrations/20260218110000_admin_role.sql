-- Admin role: allow a small set of users to access the admin section (web/marketing maintenance, email testing).
-- Assign is_admin = true via Supabase Dashboard (Table Editor > users) or a backend script. No RLS change:
-- users can only read their own row; is_admin is used in app logic to gate /admin routes and dev email APIs.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.is_admin IS 'When true, user can access /admin (maintenance, email testing). Assign via Dashboard or backend only.';
