-- Add stripe_customer_id to mosques for subscription billing
ALTER TABLE mosques
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
