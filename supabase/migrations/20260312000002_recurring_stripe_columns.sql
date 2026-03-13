ALTER TABLE recurrings ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE recurrings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
