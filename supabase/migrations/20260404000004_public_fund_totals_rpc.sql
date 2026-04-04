-- Aggregates completed donation totals per fund for a mosque.
-- Used on the public donation page (called via service-role client, no auth check).
CREATE OR REPLACE FUNCTION get_public_fund_totals(p_mosque_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT fund_id, SUM(amount)::BIGINT AS total
    FROM donations
    WHERE mosque_id = p_mosque_id
      AND status = 'completed'
      AND fund_id IS NOT NULL
    GROUP BY fund_id
  ) t;
$$;

-- Only service-role should call this (admin client). Revoke from public/anon/authenticated.
REVOKE EXECUTE ON FUNCTION get_public_fund_totals(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_public_fund_totals(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION get_public_fund_totals(UUID) FROM authenticated;

-- Sum of all completed recurring donations for a mosque (dashboard use).
CREATE OR REPLACE FUNCTION get_recurring_donation_total(p_mosque_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::BIGINT
  FROM donations
  WHERE mosque_id = p_mosque_id
    AND status = 'completed'
    AND is_recurring = true;
$$;

REVOKE EXECUTE ON FUNCTION get_recurring_donation_total(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_recurring_donation_total(UUID) TO authenticated;
