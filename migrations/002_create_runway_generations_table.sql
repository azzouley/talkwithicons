-- ============================================================================
-- TalkWithIcons — runway_generations table migration
-- Purpose: durable per-generation record for every Runway output (video or
--          image). runway_usage (existing) only tracks aggregate monthly
--          credit spend by period — it has no per-generation row at all, so
--          there was nowhere to store which asset a given task produced once
--          Runway's own signed CloudFront URL expired. This table is that
--          record, keyed by Runway's task id, holding the permanent Vercel
--          Blob URL as the canonical asset reference.
-- Safe to run more than once (idempotent). Does not touch existing tables.
-- Target: Neon Postgres (talkwithicons-db).
-- ============================================================================

CREATE TABLE IF NOT EXISTS runway_generations (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Runway's own task id — the natural key for this table, one row per task.
  task_id             TEXT        NOT NULL,

  -- 'video' (image_to_video) or 'image' (future text_to_image use)
  media_type          TEXT        NOT NULL,

  -- Canonical, non-expiring reference. This is what every downstream
  -- consumer (carousel assembly, Blotato scheduling, anything else) should
  -- read — never runway_output_url_last_seen below.
  blob_url            TEXT,

  -- Runway's original signed CloudFront output URL, kept only as a debug/
  -- audit trail of what was actually fetched at upload time. Known to
  -- expire — never treat this column as a stable reference.
  runway_output_url_last_seen TEXT,

  -- Runway's own reported status at the time this row was last written
  -- ('SUCCEEDED', 'FAILED', etc.) plus the credit cost for that generation.
  runway_status       TEXT,
  credits             INTEGER,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per Runway task; re-polling the same completed task upserts
-- rather than duplicating.
CREATE UNIQUE INDEX IF NOT EXISTS runway_generations_task_id_uidx
  ON runway_generations (task_id);

CREATE INDEX IF NOT EXISTS runway_generations_created_at_idx
  ON runway_generations (created_at);
