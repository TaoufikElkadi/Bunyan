-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE anbi_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper function: get current user's mosque_id
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_mosque_id()
RETURNS UUID AS $$
  SELECT mosque_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- MOSQUES policies
-- ============================================================
-- Authenticated users can read their own mosque
CREATE POLICY "Users can read own mosque"
  ON mosques FOR SELECT
  USING (id = get_user_mosque_id());

-- Admins can update their own mosque
CREATE POLICY "Admins can update own mosque"
  ON mosques FOR UPDATE
  USING (id = get_user_mosque_id())
  WITH CHECK (id = get_user_mosque_id());

-- Insert handled by service role during onboarding (no user policy needed)

-- ============================================================
-- USERS policies
-- ============================================================
CREATE POLICY "Users can read own mosque members"
  ON users FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- FUNDS policies
-- ============================================================
-- Public can read active funds (for donation pages, no auth)
CREATE POLICY "Public can read active funds"
  ON funds FOR SELECT
  USING (is_active = TRUE);

-- Authenticated users can manage their mosque's funds
CREATE POLICY "Users can manage own mosque funds"
  ON funds FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- DONORS policies
-- ============================================================
CREATE POLICY "Users can manage own mosque donors"
  ON donors FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- DONATIONS policies
-- ============================================================
CREATE POLICY "Users can manage own mosque donations"
  ON donations FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- RECURRINGS policies
-- ============================================================
CREATE POLICY "Users can manage own mosque recurrings"
  ON recurrings FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- CAMPAIGNS policies
-- ============================================================
-- Public can read active campaigns (for donation pages)
CREATE POLICY "Public can read active campaigns"
  ON campaigns FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can manage own mosque campaigns"
  ON campaigns FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- ANBI RECEIPTS policies
-- ============================================================
CREATE POLICY "Users can manage own mosque anbi receipts"
  ON anbi_receipts FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- QR LINKS policies
-- ============================================================
CREATE POLICY "Users can manage own mosque qr links"
  ON qr_links FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- AUDIT LOG policies
-- ============================================================
CREATE POLICY "Users can read own mosque audit log"
  ON audit_log FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Users can create audit entries for own mosque"
  ON audit_log FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id());

-- ============================================================
-- PLAN USAGE policies
-- ============================================================
CREATE POLICY "Users can read own mosque plan usage"
  ON plan_usage FOR SELECT
  USING (mosque_id = get_user_mosque_id());
