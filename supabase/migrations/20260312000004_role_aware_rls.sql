-- Migration: Role-aware RLS policies
-- Splits FOR ALL policies into separate SELECT / INSERT / UPDATE / DELETE
-- so that only admins can write, while viewers retain read access.

-- ============================================================================
-- 1. Helper function: get_user_role()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- 2. funds — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque funds" ON funds;

CREATE POLICY "Users can read own mosque funds"
  ON funds FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque funds"
  ON funds FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque funds"
  ON funds FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque funds"
  ON funds FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 3. donors — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque donors" ON donors;

CREATE POLICY "Users can read own mosque donors"
  ON donors FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque donors"
  ON donors FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque donors"
  ON donors FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque donors"
  ON donors FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 4. donations — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque donations" ON donations;

CREATE POLICY "Users can read own mosque donations"
  ON donations FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque donations"
  ON donations FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque donations"
  ON donations FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque donations"
  ON donations FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 5. recurrings — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque recurrings" ON recurrings;

CREATE POLICY "Users can read own mosque recurrings"
  ON recurrings FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque recurrings"
  ON recurrings FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque recurrings"
  ON recurrings FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque recurrings"
  ON recurrings FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 6. campaigns — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque campaigns" ON campaigns;

CREATE POLICY "Users can read own mosque campaigns"
  ON campaigns FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque campaigns"
  ON campaigns FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque campaigns"
  ON campaigns FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 7. anbi_receipts — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque anbi receipts" ON anbi_receipts;

CREATE POLICY "Users can read own mosque anbi receipts"
  ON anbi_receipts FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque anbi receipts"
  ON anbi_receipts FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque anbi receipts"
  ON anbi_receipts FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque anbi receipts"
  ON anbi_receipts FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 8. qr_links — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque qr links" ON qr_links;

CREATE POLICY "Users can read own mosque qr links"
  ON qr_links FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque qr links"
  ON qr_links FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque qr links"
  ON qr_links FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque qr links"
  ON qr_links FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 9. mosques — tighten UPDATE policy to require admin role
-- ============================================================================

DROP POLICY "Admins can update own mosque" ON mosques;

CREATE POLICY "Admins can update own mosque"
  ON mosques FOR UPDATE
  USING (id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (id = get_user_mosque_id() AND get_user_role() = 'admin');
