-- Index for dashboard "new donors this month" query
CREATE INDEX IF NOT EXISTS idx_donors_first_donated
  ON donors(mosque_id, first_donated_at);

-- Index for recurrings filtered by status (dashboard MRR query)
CREATE INDEX IF NOT EXISTS idx_recurrings_active
  ON recurrings(mosque_id, status) WHERE status = 'active';

-- RPC: aggregate donation totals per fund (replaces fetching all donations)
CREATE OR REPLACE FUNCTION get_fund_totals(p_mosque_id UUID)
RETURNS TABLE(fund_id UUID, total BIGINT) AS $$
  SELECT fund_id, SUM(amount)::BIGINT AS total
  FROM donations
  WHERE mosque_id = p_mosque_id AND status = 'completed'
  GROUP BY fund_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
