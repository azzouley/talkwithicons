-- ============================================================================
-- TalkWithIcons — calls table migration
-- Purpose: durable per-call record so per-icon volume, minutes, conversion,
--          revenue, and donation can be reported without hitting Vapi's dashboard.
-- Safe to run more than once (idempotent). Does not touch existing tables.
-- Target: Neon Postgres (talkwithicons-db).
-- ============================================================================

CREATE TABLE IF NOT EXISTS calls (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- when the call ended (webhook fire time, UTC)
  ended_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- who was called
  character_name    TEXT        NOT NULL,           -- e.g. 'Aela', 'Casanova'
  assistant_id      TEXT,                            -- Vapi assistant id, for joins/debug
  phone_number_id   TEXT,                            -- Vapi phone number id (optional)

  -- Vapi identifiers (for reconciliation against Vapi logs)
  -- Always populated: Vapi supplies a call id on the end webhook; if one is ever
  -- missing, the logger synthesizes a fallback so this column is never null and
  -- the simple ON CONFLICT (vapi_call_id) upsert target always works.
  vapi_call_id      TEXT        NOT NULL,

  -- duration
  duration_seconds  INTEGER     NOT NULL DEFAULT 0,
  duration_minutes  NUMERIC(6,2) NOT NULL DEFAULT 0, -- convenience, billed/rounded minutes

  -- funnel / conversion
  reached_gate      BOOLEAN     NOT NULL DEFAULT false,  -- got past the free window into paid
  converted         BOOLEAN     NOT NULL DEFAULT false,  -- an actual charge occurred
  ended_reason      TEXT,                                -- Vapi endedReason, e.g. 'customer-ended-call'

  -- money (store cents as integers to avoid float drift)
  revenue_cents     INTEGER     NOT NULL DEFAULT 0,
  donation_cents    INTEGER     NOT NULL DEFAULT 0,

  -- call type so standard / gift / tour can be separated later
  call_type         TEXT        NOT NULL DEFAULT 'standard',  -- 'standard' | 'gift' | 'tour'

  -- link to the payment row if one exists (nullable; no FK to avoid coupling)
  transaction_id    TEXT,

  -- raw safety net: keep the webhook payload for anything we didn't model yet
  raw               JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- De-dupe guard: the webhook can fire more than once for the same call.
-- vapi_call_id is NOT NULL, so a plain unique index is the upsert arbiter.
CREATE UNIQUE INDEX IF NOT EXISTS calls_vapi_call_id_uidx
  ON calls (vapi_call_id);

-- Reporting indexes
CREATE INDEX IF NOT EXISTS calls_character_idx ON calls (character_name);
CREATE INDEX IF NOT EXISTS calls_ended_at_idx  ON calls (ended_at);
CREATE INDEX IF NOT EXISTS calls_type_idx      ON calls (call_type);
