-- ============================================================
-- Mosque approval gate: new mosques are pending until approved
-- ============================================================

-- 1. Add status column
ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 2. Mark all existing mosques as active (they were already live)
UPDATE mosques SET status = 'active', approved_at = created_at WHERE status = 'pending';

-- 3. Update the public_mosques view to only expose active mosques
CREATE OR REPLACE VIEW public_mosques
  WITH (security_invoker = true)
AS
  SELECT id, name, slug, city, logo_url, banner_url, primary_color,
         welcome_msg, anbi_status, rsin, language
  FROM mosques
  WHERE status = 'active';
