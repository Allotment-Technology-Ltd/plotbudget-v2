-- One-time codes for native → web session handoff.
-- POST /api/auth/session-from-app stores a code; GET /auth/from-app consumes it and sets the session cookie.
CREATE TABLE IF NOT EXISTS auth_handoff (
  code TEXT PRIMARY KEY,
  session_payload TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
-- Remove expired rows periodically (optional; can also rely on check at read time).
CREATE INDEX IF NOT EXISTS idx_auth_handoff_expires_at ON auth_handoff (expires_at);
COMMENT ON TABLE auth_handoff IS 'Short-lived codes for handing off native app session to web; single-use, ~2 min TTL.';
-- Only service role (API routes) can read/write; no RLS policies for anon/authenticated.
ALTER TABLE auth_handoff ENABLE ROW LEVEL SECURITY;
-- No policies: authenticated and anon get no access; service role bypasses RLS.;
