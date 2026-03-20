-- Track which campaign a donation came through
ALTER TABLE donations ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id) WHERE campaign_id IS NOT NULL;
