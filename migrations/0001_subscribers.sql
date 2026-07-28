-- Newsletter intake schema — see tasks/newsletter-intake-spec-2026-07-15.md
-- Apply locally:  wrangler d1 execute packetpilot-subs --local  --file=migrations/0001_subscribers.sql
-- Apply to prod (after `wrangler d1 create packetpilot-subs` + real database_id in wrangler.jsonc):
--                wrangler d1 execute packetpilot-subs --remote --file=migrations/0001_subscribers.sql

CREATE TABLE subscribers (
  id            INTEGER PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  status        TEXT NOT NULL DEFAULT 'pending_sync',
                -- pending_sync | synced | active | unsubscribed | invalid
  source        TEXT,                -- 'newsletter-bar' | 'starter-kit'
  page          TEXT,                -- path the form was on
  utm_source    TEXT, utm_medium TEXT, utm_campaign TEXT,
  beehiiv_id    TEXT,
  created_at    TEXT NOT NULL,       -- ISO 8601 UTC
  updated_at    TEXT NOT NULL
);

CREATE TABLE sub_events (            -- append-only audit trail (provenance)
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL,
  event       TEXT NOT NULL,         -- subscribed | sync_ok | sync_fail | reconciled_active |
                                     -- reconciled_unsub | imported
  detail      TEXT,                  -- JSON blob (error msg, beehiiv status, …)
  at          TEXT NOT NULL
);
