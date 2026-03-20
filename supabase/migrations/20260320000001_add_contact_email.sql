-- Add contact_email to mosques for Reply-To in outbound emails
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS contact_email TEXT;
