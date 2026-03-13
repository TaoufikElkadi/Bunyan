-- Add Stripe columns alongside existing Mollie columns
-- Both can coexist — mosque chooses which provider to use

-- Mosque-level Stripe connection
ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ;

-- Donation-level Stripe payment reference
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
  ALTER COLUMN method TYPE TEXT; -- drop the CHECK to add 'stripe'

-- Re-add the CHECK with stripe included
ALTER TABLE donations
  DROP CONSTRAINT IF EXISTS donations_method_check;
ALTER TABLE donations
  ADD CONSTRAINT donations_method_check
  CHECK (method IN ('ideal', 'card', 'sepa', 'cash', 'bank_transfer', 'stripe'));

CREATE INDEX IF NOT EXISTS idx_donations_stripe ON donations(stripe_payment_intent_id);
