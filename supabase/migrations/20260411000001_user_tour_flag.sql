-- Add has_seen_tour flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT FALSE;
