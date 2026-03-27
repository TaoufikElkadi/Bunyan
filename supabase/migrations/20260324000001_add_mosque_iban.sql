-- Add IBAN column to mosques table for bank transfer instructions on periodic gift agreements
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS iban TEXT;
