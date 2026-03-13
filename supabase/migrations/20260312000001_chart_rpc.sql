CREATE OR REPLACE FUNCTION get_monthly_totals(p_mosque_id UUID)
RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month), '[]'::json)
  FROM (
    SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
           SUM(amount)::BIGINT AS total
    FROM donations
    WHERE mosque_id = p_mosque_id
      AND status = 'completed'
      AND created_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
    GROUP BY date_trunc('month', created_at)
    ORDER BY date_trunc('month', created_at)
  ) t;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_fund_breakdown(p_mosque_id UUID, p_month_start TIMESTAMPTZ)
RETURNS JSON AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT f.name, SUM(d.amount)::BIGINT AS total
    FROM donations d
    JOIN funds f ON f.id = d.fund_id
    WHERE d.mosque_id = p_mosque_id
      AND d.status = 'completed'
      AND d.created_at >= p_month_start
    GROUP BY f.name
    ORDER BY total DESC
  ) t;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
