CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(mosque_id, campaign_id) WHERE campaign_id IS NOT NULL;
