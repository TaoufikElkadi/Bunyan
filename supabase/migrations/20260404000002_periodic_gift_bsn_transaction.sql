-- Add BSN and transaction number to periodic gift agreements
-- Required by Artikel 41 Uitvoeringsregeling inkomstenbelasting 2001:
--   sub a: naam, adres, BSN van de belastingplichtige
--   sub e: uniek transactienummer (max 15 cijfers)

ALTER TABLE periodic_gift_agreements
  ADD COLUMN donor_bsn TEXT,
  ADD COLUMN transaction_number TEXT;

-- Generate unique 15-digit transaction numbers for existing agreements
-- Format: YYYYMMDD + 7-digit sequence (zero-padded)
DO $$
DECLARE
  r RECORD;
  seq INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id, created_at
    FROM periodic_gift_agreements
    ORDER BY created_at
  LOOP
    seq := seq + 1;
    UPDATE periodic_gift_agreements
    SET transaction_number = TO_CHAR(r.created_at, 'YYYYMMDD') || LPAD(seq::TEXT, 7, '0')
    WHERE id = r.id;
  END LOOP;
END $$;

-- Make transaction_number NOT NULL and unique going forward
ALTER TABLE periodic_gift_agreements
  ALTER COLUMN transaction_number SET NOT NULL,
  ADD CONSTRAINT periodic_gift_transaction_number_unique UNIQUE (transaction_number);

-- Create function to auto-generate transaction numbers for new agreements
CREATE OR REPLACE FUNCTION generate_periodic_gift_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix TEXT;
  max_seq INTEGER;
BEGIN
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COALESCE(MAX(SUBSTRING(transaction_number FROM 9)::INTEGER), 0)
  INTO max_seq
  FROM periodic_gift_agreements
  WHERE transaction_number LIKE date_prefix || '%';

  NEW.transaction_number := date_prefix || LPAD((max_seq + 1)::TEXT, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_periodic_gift_transaction_number
  BEFORE INSERT ON periodic_gift_agreements
  FOR EACH ROW
  WHEN (NEW.transaction_number IS NULL)
  EXECUTE FUNCTION generate_periodic_gift_transaction_number();
