-- Composite index for dashboard and donations list queries
-- Covers: filtered by mosque + status, ordered by date
CREATE INDEX IF NOT EXISTS idx_donations_mosque_status_date
  ON donations(mosque_id, status, created_at DESC);
