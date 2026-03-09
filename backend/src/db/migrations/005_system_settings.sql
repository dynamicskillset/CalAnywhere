-- Migration 005: System settings + admin sessions
-- system_settings: extensible key/value table for feature flags and config.
-- admin_sessions: separate session store for the admin dashboard.

CREATE TABLE IF NOT EXISTS system_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default: signups open. ON CONFLICT DO NOTHING so re-running is safe.
INSERT INTO system_settings (key, value) VALUES ('signups_enabled', 'true')
  ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token      VARCHAR(64) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
