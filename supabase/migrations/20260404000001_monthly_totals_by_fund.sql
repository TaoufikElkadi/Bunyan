-- Returns monthly donation totals broken down by fund for stacked bar chart
CREATE OR REPLACE FUNCTION get_monthly_totals_by_fund(p_mosque_id UUID)
RETURNS JSON AS $$
BEGIN
  IF p_mosque_id <> get_user_mosque_id() THEN
    RAISE EXCEPTION 'Access denied: mosque_id mismatch';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.month, t.fund_name), '[]'::json)
    FROM (
      SELECT to_char(date_trunc('month', d.created_at), 'YYYY-MM') AS month,
             f.name AS fund_name,
             SUM(d.amount)::BIGINT AS total
      FROM donations d
      JOIN funds f ON f.id = d.fund_id
      WHERE d.mosque_id = p_mosque_id
        AND d.status = 'completed'
        AND d.created_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY date_trunc('month', d.created_at), f.name
      ORDER BY date_trunc('month', d.created_at), f.name
    ) t
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_monthly_totals_by_fund(UUID) TO authenticated;
