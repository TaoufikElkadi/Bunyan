-- Atomic scan_count increment for QR links.
-- Replaces read-then-write pattern that loses counts under concurrent scans.

CREATE OR REPLACE FUNCTION increment_scan_count(link_id UUID)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE qr_links SET scan_count = scan_count + 1 WHERE id = link_id;
$$;
