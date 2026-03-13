-- ============================================================
-- Add treasurer role + invite tracking to users table
-- ============================================================

-- Expand the role check to include 'treasurer'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'treasurer', 'viewer'));

-- Track invite state
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- RLS: Admins can insert team members for their mosque
-- ============================================================
CREATE POLICY "Admins can insert team members"
  ON users FOR INSERT
  WITH CHECK (
    mosque_id = get_user_mosque_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- RLS: Admins can delete team members from their mosque
-- (but not themselves — enforced in application code)
-- ============================================================
CREATE POLICY "Admins can delete team members"
  ON users FOR DELETE
  USING (
    mosque_id = get_user_mosque_id()
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );
