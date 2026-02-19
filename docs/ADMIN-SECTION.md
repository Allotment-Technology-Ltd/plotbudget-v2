# Admin section

The admin section (`/admin`) is for maintaining the web app and marketing site. Only users with the **admin role** can access it.

## Assigning the admin role

1. **Supabase Dashboard:** Table Editor → `public.users` → find the user by email → set `is_admin` = `true`.
2. **SQL (Supabase SQL Editor or migration):**
   ```sql
   UPDATE public.users SET is_admin = true WHERE email = 'admin@example.com';
   ```
3. Keep the set of admins small; only assign to people who need to run email testing or use future admin tools.

## What’s in the admin section

- **Home (`/admin`):** Overview and links to Emails and to web/marketing resources (roadmap, changelog).
- **Emails (`/admin/emails`):** Trial and transactional email testing (same as the pre-production “Dev: Trial Testing” tool). Send or preview trial, grace, and PWYL templates; manipulate trial state; run cron simulation. Available to admins in any environment (including production) so you can test or debug emails without being on a pre-prod branch.

## Access control

- **Layout:** `/admin` and all routes under it require an authenticated user with `users.is_admin = true`. Others are redirected to `/dashboard`.
- **Email APIs:** The dev email APIs (`/api/dev/send-trial-email`, `trial-users`, `trial-state`, `send-trial-email-for-user`, `cron-simulation`) allow access when either:
  - Pre-production is enabled (`isTrialTestingDashboardAllowed()`), or
  - The current user has `is_admin = true`.
- So in production, only admins can use the email testing UI and APIs.

## User menu

When `is_admin` is true, the dashboard user menu shows an **Admin** item that links to `/admin`. The “Dev: Trial Testing” item is shown only when pre-prod is enabled and the user is not an admin (to avoid duplicate entry points).
