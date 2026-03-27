-- ============================================================
-- Mosque slug redirects: preserve old slugs when a mosque changes its slug
-- ============================================================

CREATE TABLE mosque_slug_redirects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id  UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  old_slug   TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mosque_slug_redirects_old_slug ON mosque_slug_redirects(old_slug);
CREATE INDEX idx_mosque_slug_redirects_mosque ON mosque_slug_redirects(mosque_id);

-- RLS: only admins of the mosque can read their own redirects
ALTER TABLE mosque_slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mosque redirects"
  ON mosque_slug_redirects FOR SELECT
  USING (mosque_id = get_user_mosque_id());

-- Public/anon read access for redirect lookups (donation pages use admin client, but belt-and-suspenders)
CREATE POLICY "Anyone can read redirects for lookup"
  ON mosque_slug_redirects FOR SELECT TO anon
  USING (true);

-- Only service role inserts (via API), no direct user inserts
-- This is handled through the admin client in the settings API

-- Add slug_changed_at to mosques for rate limiting
ALTER TABLE mosques ADD COLUMN slug_changed_at TIMESTAMPTZ;
