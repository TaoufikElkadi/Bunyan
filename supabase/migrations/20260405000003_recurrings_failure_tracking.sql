-- Track recurring payment failures for dunning
ALTER TABLE recurrings ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE recurrings ADD COLUMN IF NOT EXISTS last_failure_at TIMESTAMPTZ;
