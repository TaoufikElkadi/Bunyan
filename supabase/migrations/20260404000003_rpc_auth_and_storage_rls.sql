-- Fix critical security vulnerabilities:
--
-- 1. Add auth guards to SECURITY DEFINER RPCs that accept any p_mosque_id
--    without verifying the caller owns it (IDOR via RPC):
--    - get_fund_totals
--    - get_dashboard_metrics
--    - get_enriched_donors
--
-- 2. Restrict increment_plan_usage to service_role only (called from webhook)
--
-- 3. Fix storage bucket RLS policies on anbi-receipts and signatures:
--    SELECT policies only checked auth.role() = 'authenticated' — any logged-in
--    user could read any mosque's files. Now also checks folder ownership.
--
-- 4. REVOKE/GRANT defense-in-depth on all auth-checked RPCs.

-- =============================================================================
-- 1a. get_fund_totals — add mosque_id ownership check
-- =============================================================================
CREATE OR REPLACE FUNCTION get_fund_totals(p_mosque_id UUID)
RETURNS TABLE(fund_id UUID, total BIGINT) AS $$
BEGIN
  IF p_mosque_id <> get_user_mosque_id() THEN
    RAISE EXCEPTION 'Access denied: mosque_id mismatch';
  END IF;

  RETURN QUERY
  SELECT d.fund_id, SUM(d.amount)::BIGINT AS total
  FROM donations d
  WHERE d.mosque_id = p_mosque_id AND d.status = 'completed'
  GROUP BY d.fund_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
   SET search_path = '';

-- =============================================================================
-- 1b. get_dashboard_metrics — add mosque_id ownership check
-- =============================================================================
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_mosque_id UUID,
  p_month_start TIMESTAMPTZ
)
RETURNS JSON AS $$
BEGIN
  IF p_mosque_id <> get_user_mosque_id() THEN
    RAISE EXCEPTION 'Access denied: mosque_id mismatch';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_this_month', COALESCE((
        SELECT SUM(amount)::BIGINT
        FROM public.donations
        WHERE mosque_id = p_mosque_id
          AND status = 'completed'
          AND created_at >= p_month_start
      ), 0),
      'monthly_count', COALESCE((
        SELECT COUNT(*)::INT
        FROM public.donations
        WHERE mosque_id = p_mosque_id
          AND status = 'completed'
          AND created_at >= p_month_start
      ), 0),
      'recurring_mrr', COALESCE((
        SELECT SUM(
          CASE frequency
            WHEN 'weekly' THEN amount * 4
            WHEN 'monthly' THEN amount
            WHEN 'yearly' THEN (amount / 12)
            ELSE 0
          END
        )::BIGINT
        FROM public.recurrings
        WHERE mosque_id = p_mosque_id AND status = 'active'
      ), 0),
      'new_donors', COALESCE((
        SELECT COUNT(*)::INT
        FROM public.donors
        WHERE mosque_id = p_mosque_id
          AND first_donated_at >= p_month_start
      ), 0),
      'recent_donations', COALESCE((
        SELECT json_agg(row_to_json(t))
        FROM (
          SELECT d.id, d.amount, d.method, d.created_at,
                 f.name AS fund_name,
                 dn.name AS donor_name
          FROM public.donations d
          LEFT JOIN public.funds f ON f.id = d.fund_id
          LEFT JOIN public.donors dn ON dn.id = d.donor_id
          WHERE d.mosque_id = p_mosque_id AND d.status = 'completed'
          ORDER BY d.created_at DESC
          LIMIT 10
        ) t
      ), '[]'::json)
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
   SET search_path = '';

-- =============================================================================
-- 1c. get_enriched_donors — add mosque_id ownership check
-- =============================================================================
CREATE OR REPLACE FUNCTION get_enriched_donors(
  p_mosque_id UUID,
  p_include_anonymous BOOLEAN DEFAULT FALSE,
  p_limit INT DEFAULT 2000,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  mosque_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tags TEXT[],
  total_donated INT,
  donation_count INT,
  first_donated_at TIMESTAMPTZ,
  last_donated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  avg_donation_amount INT,
  donation_frequency TEXT,
  estimated_annual INT,
  iban_hint TEXT,
  has_active_recurring BOOLEAN,
  has_active_periodic BOOLEAN,
  total_count BIGINT
) AS $$
BEGIN
  IF p_mosque_id <> get_user_mosque_id() THEN
    RAISE EXCEPTION 'Access denied: mosque_id mismatch';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.mosque_id,
    d.name,
    d.email,
    d.phone,
    d.address,
    d.tags,
    d.total_donated,
    d.donation_count,
    d.first_donated_at,
    d.last_donated_at,
    d.created_at,
    d.updated_at,
    d.avg_donation_amount,
    d.donation_frequency,
    d.estimated_annual,
    d.iban_hint,
    EXISTS(
      SELECT 1 FROM public.recurrings r
      WHERE r.donor_id = d.id AND r.mosque_id = p_mosque_id AND r.status = 'active'
    ) AS has_active_recurring,
    EXISTS(
      SELECT 1 FROM public.periodic_gift_agreements p
      WHERE p.donor_id = d.id AND p.mosque_id = p_mosque_id AND p.status = 'active'
    ) AS has_active_periodic,
    COUNT(*) OVER() AS total_count
  FROM public.donors d
  WHERE d.mosque_id = p_mosque_id
    AND (p_include_anonymous OR d.email IS NOT NULL OR d.name IS NOT NULL)
  ORDER BY d.total_donated DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
   SET search_path = '';

-- =============================================================================
-- 2. increment_plan_usage — restrict to service_role only
-- =============================================================================
-- Recreate with search_path set (no auth check needed — service_role only)
CREATE OR REPLACE FUNCTION increment_plan_usage(p_mosque_id UUID, p_month DATE)
RETURNS void AS $$
  INSERT INTO public.plan_usage (mosque_id, month, online_donations)
  VALUES (p_mosque_id, p_month, 1)
  ON CONFLICT (mosque_id, month)
  DO UPDATE SET online_donations = public.plan_usage.online_donations + 1;
$$ LANGUAGE sql VOLATILE SECURITY DEFINER
   SET search_path = '';

REVOKE EXECUTE ON FUNCTION increment_plan_usage(UUID, DATE) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_plan_usage(UUID, DATE) FROM authenticated;
GRANT EXECUTE ON FUNCTION increment_plan_usage(UUID, DATE) TO service_role;

-- =============================================================================
-- 3. Storage bucket RLS — fix anbi-receipts and signatures
-- =============================================================================

-- 3a. anbi-receipts: fix SELECT policy to check folder ownership
DROP POLICY IF EXISTS "Authenticated users can read own mosque receipts" ON storage.objects;
CREATE POLICY "Authenticated users can read own mosque receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'anbi-receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = get_user_mosque_id()::text
  );

-- 3b. anbi-receipts: add INSERT policy with folder ownership check
DROP POLICY IF EXISTS "Authenticated users can insert own mosque receipts" ON storage.objects;
CREATE POLICY "Authenticated users can insert own mosque receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'anbi-receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = get_user_mosque_id()::text
  );

-- 3c. anbi-receipts: add DELETE policy with folder ownership check
DROP POLICY IF EXISTS "Authenticated users can delete own mosque receipts" ON storage.objects;
CREATE POLICY "Authenticated users can delete own mosque receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'anbi-receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = get_user_mosque_id()::text
  );

-- 3d. signatures: fix SELECT policy to check folder ownership
DROP POLICY IF EXISTS "Authenticated users can read own mosque signatures" ON storage.objects;
CREATE POLICY "Authenticated users can read own mosque signatures"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = get_user_mosque_id()::text
  );

-- 3e. signatures: add INSERT policy with folder ownership check
DROP POLICY IF EXISTS "Authenticated users can insert own mosque signatures" ON storage.objects;
CREATE POLICY "Authenticated users can insert own mosque signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = get_user_mosque_id()::text
  );

-- 3f. signatures: add DELETE policy with folder ownership check
DROP POLICY IF EXISTS "Authenticated users can delete own mosque signatures" ON storage.objects;
CREATE POLICY "Authenticated users can delete own mosque signatures"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'signatures'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = get_user_mosque_id()::text
  );

-- =============================================================================
-- 4. REVOKE/GRANT defense-in-depth for all auth-checked RPCs
-- =============================================================================

-- get_fund_totals
REVOKE EXECUTE ON FUNCTION get_fund_totals(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_fund_totals(UUID) TO authenticated;

-- get_dashboard_metrics
REVOKE EXECUTE ON FUNCTION get_dashboard_metrics(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID, TIMESTAMPTZ) TO authenticated;

-- get_enriched_donors
REVOKE EXECUTE ON FUNCTION get_enriched_donors(UUID, BOOLEAN, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_enriched_donors(UUID, BOOLEAN, INT, INT) TO authenticated;

-- Also add REVOKE/GRANT for the RPCs fixed in earlier migrations (defense-in-depth)
REVOKE EXECUTE ON FUNCTION get_monthly_totals(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_monthly_totals(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION get_fund_breakdown(UUID, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_fund_breakdown(UUID, TIMESTAMPTZ) TO authenticated;
