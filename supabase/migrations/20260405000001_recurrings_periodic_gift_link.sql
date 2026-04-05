-- Link recurrings to periodic gift agreements so dashboard can show
-- which Stripe subscription backs which ANBI contract.
ALTER TABLE recurrings
  ADD COLUMN IF NOT EXISTS periodic_gift_agreement_id UUID
    REFERENCES periodic_gift_agreements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recurrings_periodic_gift
  ON recurrings(periodic_gift_agreement_id)
  WHERE periodic_gift_agreement_id IS NOT NULL;
