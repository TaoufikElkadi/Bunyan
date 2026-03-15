-- ANBI Receipt Enhancements: receipt numbering + periodic gift agreements

-- Add sequential receipt number to anbi_receipts
ALTER TABLE anbi_receipts ADD COLUMN receipt_number TEXT;
CREATE UNIQUE INDEX idx_anbi_receipt_number ON anbi_receipts(mosque_id, receipt_number);

-- Function to generate next receipt number: ANBI-{year}-{seq padded to 6}
CREATE OR REPLACE FUNCTION generate_anbi_receipt_number(p_mosque_id UUID, p_year INTEGER)
RETURNS TEXT AS $$
DECLARE
  next_seq INTEGER;
  prefix TEXT;
BEGIN
  prefix := 'ANBI-' || p_year || '-';
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM LENGTH(prefix) + 1) AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM anbi_receipts
  WHERE mosque_id = p_mosque_id
    AND receipt_number LIKE prefix || '%';
  RETURN prefix || LPAD(next_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Periodic gift agreements table
CREATE TABLE periodic_gift_agreements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id       UUID NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  donor_id        UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
  annual_amount   INTEGER NOT NULL,
  fund_id         UUID REFERENCES funds(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_periodic_gifts_mosque ON periodic_gift_agreements(mosque_id);
CREATE INDEX idx_periodic_gifts_donor ON periodic_gift_agreements(mosque_id, donor_id);

-- RLS for periodic_gift_agreements
ALTER TABLE periodic_gift_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own mosque periodic gifts"
  ON periodic_gift_agreements FOR ALL
  USING (mosque_id = get_user_mosque_id())
  WITH CHECK (mosque_id = get_user_mosque_id());
