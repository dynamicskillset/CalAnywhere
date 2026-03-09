-- Migration 004: Owner availability window and timezone
-- Replaces the hardcoded 09:00-17:00 slot generation with per-page settings.

-- Wall-clock start and end of the owner's available hours (HH:MM, 24h)
ALTER TABLE scheduling_pages ADD COLUMN IF NOT EXISTS availability_start VARCHAR(5) NOT NULL DEFAULT '09:00';
ALTER TABLE scheduling_pages ADD COLUMN IF NOT EXISTS availability_end   VARCHAR(5) NOT NULL DEFAULT '17:00';

-- IANA timezone name for the owner (e.g. 'Europe/London', 'America/New_York')
-- NULL means fall back to UTC on the server; clients default to browser-detected zone.
ALTER TABLE scheduling_pages ADD COLUMN IF NOT EXISTS owner_timezone VARCHAR(50);
