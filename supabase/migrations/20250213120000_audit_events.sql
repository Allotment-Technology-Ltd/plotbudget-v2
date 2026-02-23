-- Audit events for security and compliance (open banking readiness, GDPR).
-- Store security-relevant events: login, logout, password_change, account_deleted, data_export, partner_invite_sent, partner_revoked, etc.
-- No PII in resource_detail; use only for event type and optional non-sensitive context.

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  resource TEXT,
  resource_detail JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_events_user_id_idx ON public.audit_events(user_id);
CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON public.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_event_type_idx ON public.audit_events(event_type);
COMMENT ON TABLE public.audit_events IS 'Security and compliance audit trail; no passwords or tokens';
COMMENT ON COLUMN public.audit_events.event_type IS 'e.g. login, logout, password_change, account_deleted, data_export, partner_invite_sent';
COMMENT ON COLUMN public.audit_events.resource_detail IS 'Optional non-sensitive context; never store secrets';
-- RLS: users can read only their own events (for transparency). Inserts use createAdminClient() (service_role), which bypasses RLS.
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_events_select_own ON public.audit_events
  FOR SELECT
  USING (auth.uid() = user_id);
