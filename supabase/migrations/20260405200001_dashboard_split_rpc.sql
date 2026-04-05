-- Dashboard redesign: split donation totals into one-time vs recurring
-- and extend get_dashboard_metrics with the same split.
--
-- 1. get_monthly_totals_split — returns ALL historical monthly data
--    with total, one_time, recurring columns (enables YoY overlays).
-- 2. get_dashboard_metrics — adds one_time_total and recurring_total.

-- =============================================================================
-- 1. New RPC: get_monthly_totals_split
-- =============================================================================
CREATE OR REPLACE FUNCTION get_monthly_totals_split(p_mosque_id UUID)
RETURNS JSON AS $$
BEGIN
  IF p_mosque_id <> public.get_user_mosque_id() THEN
    RAISE EXCEPTION 'Access denied: mosque_id mismatch';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::json)
    FROM (
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
             SUM(amount)::BIGINT AS total,
             SUM(CASE WHEN is_recurring = FALSE THEN amount ELSE 0 END)::BIGINT AS one_time,
             SUM(CASE WHEN is_recurring = TRUE THEN amount ELSE 0 END)::BIGINT AS recurring
      FROM public.donations
      WHERE mosque_id = p_mosque_id
        AND status = 'completed'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
   SET search_path = '';

REVOKE EXECUTE ON FUNCTION get_monthly_totals_split(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_monthly_totals_split(UUID) TO authenticated;

-- =============================================================================
-- 2. Extend get_dashboard_metrics with one_time_total and recurring_total
-- =============================================================================
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_mosque_id UUID,
  p_month_start TIMESTAMPTZ
)
RETURNS JSON AS $$
BEGIN
  IF p_mosque_id <> public.get_user_mosque_id() THEN
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
      'one_time_total', COALESCE((
        SELECT SUM(amount)::BIGINT
        FROM public.donations
        WHERE mosque_id = p_mosque_id
          AND status = 'completed'
          AND is_recurring = FALSE
          AND created_at >= p_month_start
      ), 0),
      'recurring_total', COALESCE((
        SELECT SUM(amount)::BIGINT
        FROM public.donations
        WHERE mosque_id = p_mosque_id
          AND status = 'completed'
          AND is_recurring = TRUE
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
