# Native app ↔ Web API ↔ Supabase: same project required

When the native app adds a bill (or calls any API that uses a Bearer token), the request goes to the **web app**, which then talks to **Supabase**. Both the app and the API must use the **same Supabase project** or you get **Unauthorized**.

## Flow (add bill)

1. **Native app** (your phone/emulator)
   - Auth: uses `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` → user signs in and the JWT is issued by **this** Supabase project (e.g. dev).
   - API base URL: uses `EXPO_PUBLIC_APP_URL` (e.g. `https://app.plotbudget.com` or `http://localhost:3000`).
   - Add bill: `POST ${EXPO_PUBLIC_APP_URL}/api/seeds` with `Authorization: Bearer <jwt>`.

2. **Web app** (the host at `EXPO_PUBLIC_APP_URL`)
   - Runs on Vercel (prod/preview) or your machine (`pnpm dev` in `apps/web`).
   - Reads **its own** env: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - `POST /api/seeds` uses `createSupabaseClientFromToken(token)` and then `supabase.auth.getUser()`. That validates the JWT **against the Supabase project at `NEXT_PUBLIC_SUPABASE_URL`**.
   - If the JWT was issued by a **different** project (e.g. dev JWT sent to prod API), validation fails → **401 Unauthorized**.
   - If valid, the seed is created in **that same** Supabase project’s DB.

So: **users** are created in the Supabase project the **native** app uses. **Bills (seeds)** are created in the Supabase project the **web API** uses. For it to work, both must be the same project.

## If you see users in the DB but still get Unauthorized

- You’re looking at the **dev** Supabase project (where the native app created the user).
- The native app is sending the request to a **different** web app (e.g. production) that uses a **different** Supabase project.
- The production API validates your dev JWT against the **production** Supabase project → no such user → 401.

## Fix for local/dev

Use one Supabase project for both:

1. **Native** `apps/native/.env`:
   - `EXPO_PUBLIC_SUPABASE_URL` = your **dev** Supabase URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = your **dev** anon key
   - `EXPO_PUBLIC_APP_URL` = **the web app that uses that same dev project**

2. **Web** (the server that handles `EXPO_PUBLIC_APP_URL`):
   - If `EXPO_PUBLIC_APP_URL=http://localhost:3000`, run the web app locally and set in `apps/web/.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL` = **same** dev Supabase URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = **same** dev anon key
   - If `EXPO_PUBLIC_APP_URL` is a Vercel preview or prod URL, that deployment’s env vars must point to the **same** Supabase project as the native app.

Summary: **Native Supabase** (where the user is created) and **Web API’s Supabase** (where the bill is created and the JWT is validated) must be the same project. Check `EXPO_PUBLIC_APP_URL` and the Supabase URL used by the app at that origin.
