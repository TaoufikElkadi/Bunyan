-- Add e-signature support to periodic gift agreements

-- Donor signature fields
ALTER TABLE periodic_gift_agreements ADD COLUMN donor_signature_url TEXT;
ALTER TABLE periodic_gift_agreements ADD COLUMN donor_signed_at TIMESTAMPTZ;
ALTER TABLE periodic_gift_agreements ADD COLUMN donor_ip TEXT;

-- Board member countersignature fields
ALTER TABLE periodic_gift_agreements ADD COLUMN board_signature_url TEXT;
ALTER TABLE periodic_gift_agreements ADD COLUMN board_signed_at TIMESTAMPTZ;
ALTER TABLE periodic_gift_agreements ADD COLUMN board_signer_id UUID REFERENCES users(id);
ALTER TABLE periodic_gift_agreements ADD COLUMN board_signer_name TEXT;

-- Update status constraint to include pending_board
ALTER TABLE periodic_gift_agreements DROP CONSTRAINT periodic_gift_agreements_status_check;
ALTER TABLE periodic_gift_agreements ADD CONSTRAINT periodic_gift_agreements_status_check
  CHECK (status IN ('pending_board', 'active', 'completed', 'cancelled'));

-- New agreements from donors default to pending_board
ALTER TABLE periodic_gift_agreements ALTER COLUMN status SET DEFAULT 'pending_board';
