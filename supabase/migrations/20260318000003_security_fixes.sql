-- ============================================================
-- Security fixes: role-aware RLS + RPC caller authorization
-- ============================================================

-- ============================================================================
-- 1. households — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque households" ON households;

CREATE POLICY "Users can read own mosque households"
  ON households FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque households"
  ON households FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque households"
  ON households FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque households"
  ON households FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 2. shard_commitments — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque shard commitments" ON shard_commitments;

CREATE POLICY "Users can read own mosque shard commitments"
  ON shard_commitments FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque shard commitments"
  ON shard_commitments FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque shard commitments"
  ON shard_commitments FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque shard commitments"
  ON shard_commitments FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 3. shard_payments — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque shard payments" ON shard_payments;

CREATE POLICY "Users can read own mosque shard payments"
  ON shard_payments FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque shard payments"
  ON shard_payments FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque shard payments"
  ON shard_payments FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque shard payments"
  ON shard_payments FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 4. periodic_gift_agreements — split FOR ALL into role-aware policies
-- ============================================================================

DROP POLICY "Users can manage own mosque periodic gifts" ON periodic_gift_agreements;

CREATE POLICY "Users can read own mosque periodic gifts"
  ON periodic_gift_agreements FOR SELECT
  USING (mosque_id = get_user_mosque_id());

CREATE POLICY "Admins can insert own mosque periodic gifts"
  ON periodic_gift_agreements FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can update own mosque periodic gifts"
  ON periodic_gift_agreements FOR UPDATE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin')
  WITH CHECK (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete own mosque periodic gifts"
  ON periodic_gift_agreements FOR DELETE
  USING (mosque_id = get_user_mosque_id() AND get_user_role() = 'admin');

-- ============================================================================
-- 5. RPC: get_member_stats — add caller authorization
-- ============================================================================

CREATE OR REPLACE FUNCTION get_member_stats(p_mosque_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify caller belongs to the requested mosque
  IF p_mosque_id <> get_user_mosque_id() THEN
    RAISE EXCEPTION 'Access denied: mosque_id mismatch';
  END IF;

  SELECT json_build_object(
    'total_donors', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id),
    'active', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND last_donated_at > now() - INTERVAL '12 months'),
    'lapsed', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND last_donated_at IS NOT NULL AND last_donated_at <= now() - INTERVAL '12 months' AND last_donated_at > now() - INTERVAL '18 months'),
    'inactive', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND last_donated_at IS NOT NULL AND last_donated_at <= now() - INTERVAL '18 months'),
    'anonymous', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND email IS NULL AND name IS NULL),
    'with_periodic', (SELECT COUNT(DISTINCT pga.donor_id) FROM periodic_gift_agreements pga WHERE pga.mosque_id = p_mosque_id AND pga.status = 'active'),
    'with_recurring', (SELECT COUNT(DISTINCT r.donor_id) FROM recurrings r WHERE r.mosque_id = p_mosque_id AND r.status = 'active'),
    'avg_donation', (SELECT COALESCE(AVG(avg_donation_amount), 0)::INTEGER FROM donors WHERE mosque_id = p_mosque_id AND donation_count > 0),
    'total_donated_all_time', (SELECT COALESCE(SUM(total_donated), 0) FROM donors WHERE mosque_id = p_mosque_id),
    'high_churn_risk', (
      SELECT COUNT(*) FROM donors d
      WHERE d.mosque_id = p_mosque_id
        AND d.last_donated_at IS NOT NULL
        AND d.last_donated_at <= now() - INTERVAL '9 months'
        AND d.donation_count >= 2
        AND NOT EXISTS (SELECT 1 FROM recurrings r WHERE r.donor_id = d.id AND r.status = 'active')
        AND NOT EXISTS (SELECT 1 FROM periodic_gift_agreements pga WHERE pga.donor_id = d.id AND pga.status = 'active')
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. RPC: get_shard_stats — add caller authorization
-- ============================================================================

CREATE OR REPLACE FUNCTION get_shard_stats(p_mosque_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_month DATE := date_trunc('month', now())::date;
BEGIN
  -- Verify caller belongs to the requested mosque
  IF p_mosque_id <> get_user_mosque_id() THEN
    RAISE EXCEPTION 'Access denied: mosque_id mismatch';
  END IF;

  SELECT json_build_object(
    'active_members', (
      SELECT COUNT(*) FROM shard_commitments
      WHERE mosque_id = p_mosque_id AND status = 'active'
    ),
    'monthly_expected', (
      SELECT COALESCE(SUM(monthly_amount), 0) FROM shard_commitments
      WHERE mosque_id = p_mosque_id AND status = 'active'
    ),
    'collected_this_month', (
      SELECT COALESCE(SUM(amount_paid), 0) FROM shard_payments
      WHERE mosque_id = p_mosque_id AND month = v_month AND status = 'paid'
    ),
    'paid_this_month', (
      SELECT COUNT(*) FROM shard_payments
      WHERE mosque_id = p_mosque_id AND month = v_month AND status = 'paid'
    ),
    'unpaid_this_month', (
      SELECT COUNT(*) FROM shard_commitments sc
      WHERE sc.mosque_id = p_mosque_id AND sc.status = 'active'
        AND sc.start_date <= v_month
        AND NOT EXISTS (
          SELECT 1 FROM shard_payments sp
          WHERE sp.commitment_id = sc.id AND sp.month = v_month AND sp.status = 'paid'
        )
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
