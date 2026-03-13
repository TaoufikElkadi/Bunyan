-- RPC: single call for all dashboard metrics (replaces 4 parallel queries)
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_mosque_id UUID,
  p_month_start TIMESTAMPTZ
)
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_this_month', COALESCE((
      SELECT SUM(amount)::BIGINT
      FROM donations
      WHERE mosque_id = p_mosque_id
        AND status = 'completed'
        AND created_at >= p_month_start
    ), 0),
    'monthly_count', COALESCE((
      SELECT COUNT(*)::INT
      FROM donations
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
      FROM recurrings
      WHERE mosque_id = p_mosque_id AND status = 'active'
    ), 0),
    'new_donors', COALESCE((
      SELECT COUNT(*)::INT
      FROM donors
      WHERE mosque_id = p_mosque_id
        AND first_donated_at >= p_month_start
    ), 0),
    'recent_donations', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT d.id, d.amount, d.method, d.created_at,
               f.name AS fund_name,
               dn.name AS donor_name
        FROM donations d
        LEFT JOIN funds f ON f.id = d.fund_id
        LEFT JOIN donors dn ON dn.id = d.donor_id
        WHERE d.mosque_id = p_mosque_id AND d.status = 'completed'
        ORDER BY d.created_at DESC
        LIMIT 10
      ) t
    ), '[]'::json)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
