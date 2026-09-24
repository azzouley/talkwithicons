-- ============================================================================
-- TalkWithIcons — funnel_events table migration
-- Purpose: records call-form interactions that happen before any Stripe or
--          Vapi record exists, so the funnel can be measured from the first
--          step: form_started (phone field focused) and form_submitted
--          ("Start the Call" pressed). Written by api/track.js, fed by the
--          shared /funnel.js script on every public page.
-- Safe to run more than once (idempotent). Does not touch existing tables.
-- Target: Neon Postgres (talkwithicons-db).
-- ============================================================================

CREATE TABLE IF NOT EXISTS funnel_events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event       TEXT NOT NULL,          -- 'form_started' | 'form_submitted'
  page        TEXT NOT NULL,          -- pathname, e.g. '/rocca.html'
  session_id  TEXT,                   -- random per-tab id from sessionStorage
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funnel_events_created_at_idx ON funnel_events (created_at);
