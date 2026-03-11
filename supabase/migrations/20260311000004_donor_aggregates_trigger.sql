-- ============================================================
-- Trigger: update donor cached aggregates on donation changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_donor_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.donor_id IS NOT NULL AND NEW.status = 'completed' THEN
    UPDATE donors SET
      total_donated = (
        SELECT COALESCE(SUM(amount), 0)
        FROM donations
        WHERE donor_id = NEW.donor_id AND status = 'completed'
      ),
      donation_count = (
        SELECT COUNT(*)
        FROM donations
        WHERE donor_id = NEW.donor_id AND status = 'completed'
      ),
      last_donated_at = NOW(),
      first_donated_at = COALESCE(
        (SELECT MIN(created_at) FROM donations WHERE donor_id = NEW.donor_id AND status = 'completed'),
        NOW()
      ),
      updated_at = NOW()
    WHERE id = NEW.donor_id;
  END IF;

  -- Handle refunds: recalculate when donation is refunded
  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status = 'refunded' AND NEW.donor_id IS NOT NULL THEN
    UPDATE donors SET
      total_donated = (
        SELECT COALESCE(SUM(amount), 0)
        FROM donations
        WHERE donor_id = NEW.donor_id AND status = 'completed'
      ),
      donation_count = (
        SELECT COUNT(*)
        FROM donations
        WHERE donor_id = NEW.donor_id AND status = 'completed'
      ),
      updated_at = NOW()
    WHERE id = NEW.donor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_donation_update_donor
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_donor_aggregates();

-- ============================================================
-- Trigger: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mosques_updated_at BEFORE UPDATE ON mosques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_funds_updated_at BEFORE UPDATE ON funds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_donors_updated_at BEFORE UPDATE ON donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_donations_updated_at BEFORE UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_recurrings_updated_at BEFORE UPDATE ON recurrings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
