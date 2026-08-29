-- ============================================================================
-- TalkWithIcons — reel_assemblies table migration
-- Purpose: durable per-assembly record for every finished reel produced by
--          the caption+music assembly pipeline (api/assemble-reel.js). Each
--          row ties a source Runway clip (runway_generations.blob_url) to
--          the script/music choices used and the final assembled output's
--          permanent Vercel Blob URL.
-- Safe to run more than once (idempotent). Does not touch existing tables.
-- Target: Neon Postgres (talkwithicons-db).
-- ============================================================================

CREATE TABLE IF NOT EXISTS reel_assemblies (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Blob URL of the raw Runway clip used as input (matches
  -- runway_generations.blob_url when the source is a tracked generation).
  source_blob_url     TEXT        NOT NULL,

  -- The hook/body/payoff/cta text supplied for this assembly, kept verbatim
  -- for audit/reproducibility.
  script               JSONB       NOT NULL,

  -- Which curated royalty-free track (assets/music/manifest.json key) was
  -- used as the music bed.
  music_key            TEXT        NOT NULL,

  -- Canonical, non-expiring reference to the finished, postable reel.
  output_blob_url      TEXT,

  status                TEXT        NOT NULL,
  error                 TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reel_assemblies_created_at_idx
  ON reel_assemblies (created_at);

CREATE INDEX IF NOT EXISTS reel_assemblies_source_blob_url_idx
  ON reel_assemblies (source_blob_url);
