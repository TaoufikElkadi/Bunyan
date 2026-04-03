-- RPC: fetch donors enriched with recurring/periodic status in a single query.
-- Replaces 3 separate queries (donors + recurrings + periodics) on the leden page.
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
      SELECT 1 FROM recurrings r
      WHERE r.donor_id = d.id AND r.mosque_id = p_mosque_id AND r.status = 'active'
    ) AS has_active_recurring,
    EXISTS(
      SELECT 1 FROM periodic_gift_agreements p
      WHERE p.donor_id = d.id AND p.mosque_id = p_mosque_id AND p.status = 'active'
    ) AS has_active_periodic,
    COUNT(*) OVER() AS total_count
  FROM donors d
  WHERE d.mosque_id = p_mosque_id
    AND (p_include_anonymous OR d.email IS NOT NULL OR d.name IS NOT NULL)
  ORDER BY d.total_donated DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
