-- ============================================================
-- Shard (Contributie): monthly membership contributions
-- ============================================================

-- 1. Mosque default shard amount
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS shard_default_amount INTEGER DEFAULT 2500;

-- 2. Shard commitments table
CREATE TABLE shard_commitments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id      UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id       UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  monthly_amount INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  start_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date       DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (mosque_id, donor_id)
);

CREATE INDEX idx_shard_commitments_mosque ON shard_commitments(mosque_id);
CREATE INDEX idx_shard_commitments_donor ON shard_commitments(donor_id);
CREATE INDEX idx_shard_commitments_status ON shard_commitments(mosque_id, status);

ALTER TABLE shard_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mosque shard commitments"
  ON shard_commitments FOR ALL
  USING (mosque_id = get_user_mosque_id());

-- 3. Shard payments table
CREATE TABLE shard_payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id      UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  commitment_id  UUID NOT NULL REFERENCES shard_commitments(id) ON DELETE CASCADE,
  donor_id       UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  month          DATE NOT NULL,
  amount_paid    INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'partial')),
  method         TEXT CHECK (method IN ('cash', 'bank_transfer', 'ideal', 'stripe')),
  paid_at        TIMESTAMPTZ,
  marked_by      UUID REFERENCES users(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (commitment_id, month)
);

CREATE INDEX idx_shard_payments_mosque_month ON shard_payments(mosque_id, month DESC);
CREATE INDEX idx_shard_payments_commitment ON shard_payments(commitment_id, month DESC);
CREATE INDEX idx_shard_payments_status ON shard_payments(mosque_id, month, status);

ALTER TABLE shard_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mosque shard payments"
  ON shard_payments FOR ALL
  USING (mosque_id = get_user_mosque_id());

-- 4. Extend member_events to support shard event types
ALTER TABLE member_events DROP CONSTRAINT IF EXISTS member_events_event_type_check;
ALTER TABLE member_events ADD CONSTRAINT member_events_event_type_check
  CHECK (event_type IN (
    'donation', 'recurring_started', 'recurring_cancelled',
    'periodic_signed', 'periodic_expired', 'receipt_sent', 'tag_added',
    'shard_started', 'shard_payment', 'shard_cancelled'
  ));

-- 5. Trigger: log shard commitment events
CREATE OR REPLACE FUNCTION log_shard_commitment_event()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO member_events (mosque_id, donor_id, event_type, event_data)
    VALUES (NEW.mosque_id, NEW.donor_id, 'shard_started',
      jsonb_build_object('monthly_amount', NEW.monthly_amount, 'commitment_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO member_events (mosque_id, donor_id, event_type, event_data)
    VALUES (NEW.mosque_id, NEW.donor_id, 'shard_cancelled',
      jsonb_build_object('commitment_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_shard_commitment_event
  AFTER INSERT OR UPDATE ON shard_commitments
  FOR EACH ROW EXECUTE FUNCTION log_shard_commitment_event();

-- 6. Trigger: log shard payment events
CREATE OR REPLACE FUNCTION log_shard_payment_event()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'paid')
     OR (TG_OP = 'UPDATE' AND OLD.status <> 'paid' AND NEW.status = 'paid') THEN
    INSERT INTO member_events (mosque_id, donor_id, event_type, event_data)
    VALUES (NEW.mosque_id, NEW.donor_id, 'shard_payment',
      jsonb_build_object('amount', NEW.amount_paid, 'month', NEW.month, 'method', NEW.method));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_shard_payment_event
  AFTER INSERT OR UPDATE ON shard_payments
  FOR EACH ROW EXECUTE FUNCTION log_shard_payment_event();

-- 7. RPC: shard stats for dashboard
CREATE OR REPLACE FUNCTION get_shard_stats(p_mosque_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_month DATE := date_trunc('month', now())::date;
BEGIN
  SELECT json_build_object(
    'active_members', (
      SELECT COUNT(*) FROM shard_commitments
      WHERE mosque_id = p_mosque_id AND status = 'active'
    ),
    'monthly_expected', (
      SELECT COALESCE(SUM(monthly_amount), 0) FROM shard_commitments
      WHERE mosque_id = p_mosque_id AND status = 'active'
    ),
    'collected_this_month', (
      SELECT COALESCE(SUM(amount_paid), 0) FROM shard_payments
      WHERE mosque_id = p_mosque_id AND month = v_month AND status = 'paid'
    ),
    'paid_this_month', (
      SELECT COUNT(*) FROM shard_payments
      WHERE mosque_id = p_mosque_id AND month = v_month AND status = 'paid'
    ),
    'unpaid_this_month', (
      SELECT COUNT(*) FROM shard_commitments sc
      WHERE sc.mosque_id = p_mosque_id AND sc.status = 'active'
        AND sc.start_date <= v_month
        AND NOT EXISTS (
          SELECT 1 FROM shard_payments sp
          WHERE sp.commitment_id = sc.id AND sp.month = v_month AND sp.status = 'paid'
        )
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
