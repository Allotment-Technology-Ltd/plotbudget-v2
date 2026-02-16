# Supabase scripts

One-off or dev-only SQL scripts (not part of the migration chain).

| Script | Purpose |
|--------|---------|
| `dev-apply-push-notifications.sql` | Run once on **dev** to create `push_tokens` and preference columns if you haven’t run any push-token migrations. Do not run on prod; prod uses migrations. |
