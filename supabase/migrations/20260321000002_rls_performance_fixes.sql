-- Fix: RLS performance optimizations from Supabase Performance Advisor
-- 1. Wrap auth.uid() in (select ...) to prevent per-row re-evaluation
-- 2. Merge duplicate permissive SELECT policies on campaigns and funds

-- ============================================================
-- 1. Fix auth_rls_initplan on public.users
-- ============================================================

-- "Users can update own profile"
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- "Admins can insert team members"
DROP POLICY IF EXISTS "Admins can insert team members" ON users;
CREATE POLICY "Admins can insert team members"
  ON users FOR INSERT
  WITH CHECK (
    mosque_id = (select get_user_mosque_id())
    AND (SELECT role FROM users WHERE id = (select auth.uid())) = 'admin'
  );

-- "Admins can delete team members"
DROP POLICY IF EXISTS "Admins can delete team members" ON users;
CREATE POLICY "Admins can delete team members"
  ON users FOR DELETE
  USING (
    mosque_id = (select get_user_mosque_id())
    AND (SELECT role FROM users WHERE id = (select auth.uid())) = 'admin'
  );

-- ============================================================
-- 2. Merge duplicate permissive SELECT policies on campaigns
-- ============================================================

DROP POLICY IF EXISTS "Public can read active campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can read own mosque campaigns" ON campaigns;
CREATE POLICY "Select campaigns"
  ON campaigns FOR SELECT
  USING (
    is_active = TRUE
    OR mosque_id = (select get_user_mosque_id())
  );

-- ============================================================
-- 3. Merge duplicate permissive SELECT policies on funds
-- ============================================================

DROP POLICY IF EXISTS "Public can read active funds" ON funds;
DROP POLICY IF EXISTS "Users can read own mosque funds" ON funds;
CREATE POLICY "Select funds"
  ON funds FOR SELECT
  USING (
    is_active = TRUE
    OR mosque_id = (select get_user_mosque_id())
  );
