-- ============================================================
-- Member Intelligence: extend donors, create households & member_events
-- ============================================================

-- 1. Households table
CREATE TABLE households (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id   UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_households_mosque ON households(mosque_id);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mosque households"
  ON households FOR ALL
  USING (mosque_id = get_user_mosque_id());

-- 2. Extend donors table
ALTER TABLE donors
  ADD COLUMN IF NOT EXISTS avg_donation_amount  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS donation_frequency   TEXT DEFAULT NULL
    CHECK (donation_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly', 'irregular')),
  ADD COLUMN IF NOT EXISTS estimated_annual     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_computed_at     TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS household_id         UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes                TEXT DEFAULT NULL;

CREATE INDEX idx_donors_household ON donors(household_id) WHERE household_id IS NOT NULL;
CREATE INDEX idx_donors_last_donated ON donors(mosque_id, last_donated_at DESC NULLS LAST);

-- 3. Member events table
CREATE TABLE member_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id   UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id    UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
    'donation', 'recurring_started', 'recurring_cancelled',
    'periodic_signed', 'periodic_expired', 'receipt_sent', 'tag_added'
  )),
  event_data  JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_member_events_donor ON member_events(donor_id, created_at DESC);
CREATE INDEX idx_member_events_mosque ON member_events(mosque_id, created_at DESC);

ALTER TABLE member_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mosque member events"
  ON member_events FOR SELECT
  USING (mosque_id = get_user_mosque_id());

-- Insert-only for triggers (via SECURITY DEFINER functions)
CREATE POLICY "System can insert member events"
  ON member_events FOR INSERT
  WITH CHECK (mosque_id = get_user_mosque_id());

-- 4. Trigger: log donation events
CREATE OR REPLACE FUNCTION log_donation_member_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.donor_id IS NOT NULL AND NEW.status = 'completed' THEN
    -- Avoid duplicates: only on INSERT or status change to completed
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status <> 'completed') THEN
      INSERT INTO member_events (mosque_id, donor_id, event_type, event_data)
      VALUES (
        NEW.mosque_id,
        NEW.donor_id,
        'donation',
        jsonb_build_object('amount', NEW.amount, 'fund_id', NEW.fund_id, 'donation_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_donation_member_event
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION log_donation_member_event();

-- 5. Trigger: log recurring start/cancel events
CREATE OR REPLACE FUNCTION log_recurring_member_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO member_events (mosque_id, donor_id, event_type, event_data)
    VALUES (
      NEW.mosque_id,
      NEW.donor_id,
      'recurring_started',
      jsonb_build_object('amount', NEW.amount, 'frequency', NEW.frequency, 'recurring_id', NEW.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO member_events (mosque_id, donor_id, event_type, event_data)
    VALUES (
      NEW.mosque_id,
      NEW.donor_id,
      'recurring_cancelled',
      jsonb_build_object('recurring_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_recurring_member_event
  AFTER INSERT OR UPDATE ON recurrings
  FOR EACH ROW EXECUTE FUNCTION log_recurring_member_event();

-- 6. Trigger: log periodic gift events
CREATE OR REPLACE FUNCTION log_periodic_gift_member_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO member_events (mosque_id, donor_id, event_type, event_data)
    VALUES (
      NEW.mosque_id,
      NEW.donor_id,
      'periodic_signed',
      jsonb_build_object('annual_amount', NEW.annual_amount, 'agreement_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_periodic_gift_member_event
  AFTER INSERT ON periodic_gift_agreements
  FOR EACH ROW EXECUTE FUNCTION log_periodic_gift_member_event();

-- 7. RPC: get member stats for dashboard
CREATE OR REPLACE FUNCTION get_member_stats(p_mosque_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_donors', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id),
    'active', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND last_donated_at > now() - INTERVAL '12 months'),
    'lapsed', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND last_donated_at IS NOT NULL AND last_donated_at <= now() - INTERVAL '12 months' AND last_donated_at > now() - INTERVAL '18 months'),
    'inactive', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND last_donated_at IS NOT NULL AND last_donated_at <= now() - INTERVAL '18 months'),
    'anonymous', (SELECT COUNT(*) FROM donors WHERE mosque_id = p_mosque_id AND email IS NULL AND name IS NULL),
    'with_periodic', (SELECT COUNT(DISTINCT pga.donor_id) FROM periodic_gift_agreements pga WHERE pga.mosque_id = p_mosque_id AND pga.status = 'active'),
    'with_recurring', (SELECT COUNT(DISTINCT r.donor_id) FROM recurrings r WHERE r.mosque_id = p_mosque_id AND r.status = 'active'),
    'avg_donation', (SELECT COALESCE(AVG(avg_donation_amount), 0)::INTEGER FROM donors WHERE mosque_id = p_mosque_id AND donation_count > 0),
    'total_donated_all_time', (SELECT COALESCE(SUM(total_donated), 0) FROM donors WHERE mosque_id = p_mosque_id),
    'high_churn_risk', (
      SELECT COUNT(*) FROM donors d
      WHERE d.mosque_id = p_mosque_id
        AND d.last_donated_at IS NOT NULL
        AND d.last_donated_at <= now() - INTERVAL '9 months'
        AND d.donation_count >= 2
        AND NOT EXISTS (SELECT 1 FROM recurrings r WHERE r.donor_id = d.id AND r.status = 'active')
        AND NOT EXISTS (SELECT 1 FROM periodic_gift_agreements pga WHERE pga.donor_id = d.id AND pga.status = 'active')
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Extend the existing donor aggregates trigger to also compute frequency/avg/annual
CREATE OR REPLACE FUNCTION update_donor_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_count INTEGER;
  v_avg INTEGER;
  v_freq TEXT;
  v_annual INTEGER;
  v_intervals FLOAT[];
  v_median FLOAT;
  v_multiplier INTEGER;
  rec RECORD;
  prev_ts TIMESTAMPTZ;
BEGIN
  IF NEW.donor_id IS NOT NULL AND NEW.status = 'completed' THEN
    -- Core aggregates
    SELECT COALESCE(SUM(amount), 0), COUNT(*)
    INTO v_total, v_count
    FROM donations
    WHERE donor_id = NEW.donor_id AND status = 'completed';

    v_avg := CASE WHEN v_count > 0 THEN v_total / v_count ELSE 0 END;

    -- Compute frequency from donation intervals
    v_intervals := ARRAY[]::FLOAT[];
    prev_ts := NULL;
    FOR rec IN
      SELECT created_at FROM donations
      WHERE donor_id = NEW.donor_id AND status = 'completed'
      ORDER BY created_at ASC
    LOOP
      IF prev_ts IS NOT NULL THEN
        v_intervals := v_intervals || EXTRACT(EPOCH FROM (rec.created_at - prev_ts)) / 86400.0;
      END IF;
      prev_ts := rec.created_at;
    END LOOP;

    -- Median interval → frequency label
    v_freq := NULL;
    IF array_length(v_intervals, 1) > 0 THEN
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY val)
      INTO v_median
      FROM unnest(v_intervals) AS val;

      v_freq := CASE
        WHEN v_median <= 10 THEN 'weekly'
        WHEN v_median <= 45 THEN 'monthly'
        WHEN v_median <= 120 THEN 'quarterly'
        WHEN v_median <= 400 THEN 'yearly'
        ELSE 'irregular'
      END;
    END IF;

    v_multiplier := CASE v_freq
      WHEN 'weekly' THEN 52
      WHEN 'monthly' THEN 12
      WHEN 'quarterly' THEN 4
      WHEN 'yearly' THEN 1
      ELSE 1
    END;
    v_annual := v_avg * v_multiplier;

    UPDATE donors SET
      total_donated = v_total,
      donation_count = v_count,
      avg_donation_amount = v_avg,
      donation_frequency = v_freq,
      estimated_annual = v_annual,
      last_donated_at = NOW(),
      first_donated_at = COALESCE(
        (SELECT MIN(created_at) FROM donations WHERE donor_id = NEW.donor_id AND status = 'completed'),
        NOW()
      ),
      last_computed_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.donor_id;
  END IF;

  -- Handle refunds
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

-- 9. Backfill frequency for existing donors (one-time)
DO $$
DECLARE
  d RECORD;
  v_intervals FLOAT[];
  v_median FLOAT;
  v_freq TEXT;
  v_avg INTEGER;
  v_multiplier INTEGER;
  rec RECORD;
  prev_ts TIMESTAMPTZ;
BEGIN
  FOR d IN SELECT id, total_donated, donation_count FROM donors WHERE donation_count >= 2 LOOP
    v_intervals := ARRAY[]::FLOAT[];
    prev_ts := NULL;
    FOR rec IN
      SELECT created_at FROM donations
      WHERE donor_id = d.id AND status = 'completed'
      ORDER BY created_at ASC
    LOOP
      IF prev_ts IS NOT NULL THEN
        v_intervals := v_intervals || EXTRACT(EPOCH FROM (rec.created_at - prev_ts)) / 86400.0;
      END IF;
      prev_ts := rec.created_at;
    END LOOP;

    v_freq := NULL;
    IF array_length(v_intervals, 1) > 0 THEN
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY val)
      INTO v_median
      FROM unnest(v_intervals) AS val;

      v_freq := CASE
        WHEN v_median <= 10 THEN 'weekly'
        WHEN v_median <= 45 THEN 'monthly'
        WHEN v_median <= 120 THEN 'quarterly'
        WHEN v_median <= 400 THEN 'yearly'
        ELSE 'irregular'
      END;
    END IF;

    v_avg := CASE WHEN d.donation_count > 0 THEN d.total_donated / d.donation_count ELSE 0 END;
    v_multiplier := CASE v_freq
      WHEN 'weekly' THEN 52 WHEN 'monthly' THEN 12 WHEN 'quarterly' THEN 4 WHEN 'yearly' THEN 1 ELSE 1
    END;

    UPDATE donors SET
      avg_donation_amount = v_avg,
      donation_frequency = v_freq,
      estimated_annual = v_avg * v_multiplier,
      last_computed_at = NOW()
    WHERE id = d.id;
  END LOOP;
END;
$$;

-- 10. Backfill: populate member_events from existing donations
INSERT INTO member_events (mosque_id, donor_id, event_type, event_data, created_at)
SELECT
  d.mosque_id,
  d.donor_id,
  'donation',
  jsonb_build_object('amount', d.amount, 'fund_id', d.fund_id, 'donation_id', d.id),
  d.created_at
FROM donations d
WHERE d.donor_id IS NOT NULL AND d.status = 'completed'
ON CONFLICT DO NOTHING;

-- 11. Backfill: populate member_events from existing recurrings
INSERT INTO member_events (mosque_id, donor_id, event_type, event_data, created_at)
SELECT
  r.mosque_id,
  r.donor_id,
  'recurring_started',
  jsonb_build_object('amount', r.amount, 'frequency', r.frequency, 'recurring_id', r.id),
  r.created_at
FROM recurrings r
ON CONFLICT DO NOTHING;

-- 12. Backfill: populate member_events from existing periodic gift agreements
INSERT INTO member_events (mosque_id, donor_id, event_type, event_data, created_at)
SELECT
  pga.mosque_id,
  pga.donor_id,
  'periodic_signed',
  jsonb_build_object('annual_amount', pga.annual_amount, 'agreement_id', pga.id),
  pga.created_at
FROM periodic_gift_agreements pga
ON CONFLICT DO NOTHING;
