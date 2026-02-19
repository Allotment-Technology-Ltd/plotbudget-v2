-- Changelog entries: editable from admin UI, served via API for app and marketing.

CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  released_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_changelog_entries_released_at ON public.changelog_entries(released_at DESC);

COMMENT ON TABLE public.changelog_entries IS 'Changelog entries for What''s new; editable in admin.';

CREATE OR REPLACE FUNCTION public.touch_changelog_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_changelog_entries_updated_at ON public.changelog_entries;
CREATE TRIGGER update_changelog_entries_updated_at
  BEFORE UPDATE ON public.changelog_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_changelog_entries_updated_at();

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY changelog_entries_select_all ON public.changelog_entries
  FOR SELECT TO anon, authenticated
  USING (true);
