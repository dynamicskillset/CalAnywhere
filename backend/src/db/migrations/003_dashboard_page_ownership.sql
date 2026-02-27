-- Migration 003: Dashboard + page ownership + encrypted notification email
-- Prepares scheduling_pages for authenticated user ownership (Phase 2).

-- Add title column for dashboard display
ALTER TABLE scheduling_pages ADD COLUMN IF NOT EXISTS title VARCHAR(100);

-- Add encrypted notification email columns (AES-256-GCM)
-- These replace the plaintext owner_email for authenticated pages.
ALTER TABLE scheduling_pages ADD COLUMN IF NOT EXISTS notification_email_enc TEXT;
ALTER TABLE scheduling_pages ADD COLUMN IF NOT EXISTS notification_email_iv VARCHAR(32);
ALTER TABLE scheduling_pages ADD COLUMN IF NOT EXISTS notification_email_tag VARCHAR(32);

-- Drop plaintext owner_email (pre-auth era, never used in production)
-- owner_name stays: it's the display name shown to visitors
ALTER TABLE scheduling_pages DROP COLUMN IF EXISTS owner_email;

-- Index for dashboard queries (list pages by user)
CREATE INDEX IF NOT EXISTS idx_scheduling_pages_user_id ON scheduling_pages(user_id);

-- Note: a partial index like WHERE expires_at > NOW() is not possible
-- because NOW() is STABLE, not IMMUTABLE. The user_id index above is
-- sufficient; PostgreSQL filters by expires_at at query time.
