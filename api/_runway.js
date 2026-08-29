// api/_runway.js — shared Runway API client + monthly credit-budget tracking
// Underscore prefix: excluded from Vercel routing (not a public endpoint).
//
// Verified directly against the live API (not assumed from docs) on 2026-08-09:
// POST /v1/image_to_video -> {id, estimatedCost:{credits}}
// GET  /v1/tasks/{id}     -> {status:"RUNNING"|"SUCCEEDED"|"FAILED"|..., progress, output:[url], cost:{credits}}
// gen4.5 costs 60 credits per 5s clip = 12 credits/sec, confirmed via a real generation.

const { sql, getCurrentPeriod } = require('./_db');
const { put } = require('@vercel/blob');

const RUNWAY_BASE = 'https://api.dev.runwayml.com';
const RUNWAY_VERSION = '2024-11-06';
const CREDITS_PER_SECOND_GEN45 = 12; // derived from a real 5s clip costing 60 credits
const MONTHLY_CREDIT_CAP = 10000; // the account's real maxMonthlyCreditSpend, confirmed via /v1/organization

function runwayHeaders(extra) {
  const key = process.env.RUNWAY_API_KEY;
  return {
    Authorization: `Bearer ${key}`,
    'X-Runway-Version': RUNWAY_VERSION,
    ...extra,
  };
}

async function ensureUsageTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS runway_usage (
      period TEXT PRIMARY KEY,
      credits_used INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function getMonthlyCreditsUsed() {
  await ensureUsageTable();
  const period = getCurrentPeriod();
  const { rows } = await sql`SELECT credits_used FROM runway_usage WHERE period = ${period}`;
  return { period, creditsUsed: rows[0]?.credits_used || 0 };
}

async function recordCreditsUsed(credits) {
  await ensureUsageTable();
  const period = getCurrentPeriod();
  await sql`
    INSERT INTO runway_usage (period, credits_used, updated_at)
    VALUES (${period}, ${credits}, NOW())
    ON CONFLICT (period) DO UPDATE SET
      credits_used = runway_usage.credits_used + ${credits},
      updated_at = NOW()
  `;
}

// Local pre-flight estimate so a request can be blocked BEFORE calling Runway at
// all, rather than after Runway has already committed the spend.
function estimateCredits(durationSeconds) {
  return Math.ceil(durationSeconds * CREDITS_PER_SECOND_GEN45);
}

async function checkBudget(estimatedCredits) {
  const { creditsUsed } = await getMonthlyCreditsUsed();
  const remaining = MONTHLY_CREDIT_CAP - creditsUsed;
  return {
    allowed: estimatedCredits <= remaining,
    creditsUsed,
    remaining,
    cap: MONTHLY_CREDIT_CAP,
  };
}

async function submitImageToVideo({ promptImage, promptText, ratio, duration }) {
  const res = await fetch(`${RUNWAY_BASE}/v1/image_to_video`, {
    method: 'POST',
    headers: runwayHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      model: 'gen4.5',
      promptImage,
      promptText,
      ratio: ratio || '1280:720',
      duration: duration || 5,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`Runway task creation failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data; // {id, estimatedCost:{credits}}
}

async function getTaskStatus(taskId) {
  const res = await fetch(`${RUNWAY_BASE}/v1/tasks/${taskId}`, {
    headers: runwayHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`Runway task status failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data; // {id, status, progress?, output?, cost?}
}

// ── Output persistence ────────────────────────────────────────────────────────
// Runway's task output is a signed CloudFront URL that expires. Nothing
// downstream (carousel assembly, Blotato scheduling, anything else) can rely
// on it surviving past initial generation, so once a task completes we fetch
// the file ourselves, server-side, and re-host it permanently in Vercel Blob.
// The Blob URL — not Runway's URL — is what every caller should treat as the
// canonical asset reference from this point forward.

const EXT_BY_CONTENT_TYPE = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

async function persistOutputToBlob({ taskId, outputUrl }) {
  const fetchRes = await fetch(outputUrl);
  if (!fetchRes.ok) {
    throw new Error(`Fetching Runway output failed: HTTP ${fetchRes.status}`);
  }
  const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream';
  const mediaType = contentType.startsWith('video/') ? 'video'
    : contentType.startsWith('image/') ? 'image'
    : 'unknown';
  const ext = EXT_BY_CONTENT_TYPE[contentType] || (mediaType === 'video' ? 'mp4' : 'bin');
  const buffer = Buffer.from(await fetchRes.arrayBuffer());

  const blob = await put(`runway/${taskId}.${ext}`, buffer, {
    access: 'public',
    contentType,
    addRandomSuffix: false, // deterministic path per task — a re-poll of the same
                             // completed task overwrites the same object, not a new one
  });

  return { blobUrl: blob.url, mediaType, bytes: buffer.length };
}

async function ensureGenerationsTable() {
  // Belt-and-suspenders: migrations/002 already creates this, but a fresh
  // environment that skipped the migration step shouldn't silently drop
  // ledger writes.
  await sql`
    CREATE TABLE IF NOT EXISTS runway_generations (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      task_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      blob_url TEXT,
      runway_output_url_last_seen TEXT,
      runway_status TEXT,
      credits INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS runway_generations_task_id_uidx ON runway_generations (task_id)`;
}

async function upsertGeneration({ taskId, mediaType, blobUrl, runwayOutputUrl, status, credits }) {
  await ensureGenerationsTable();
  await sql`
    INSERT INTO runway_generations
      (task_id, media_type, blob_url, runway_output_url_last_seen, runway_status, credits, updated_at)
    VALUES
      (${taskId}, ${mediaType}, ${blobUrl}, ${runwayOutputUrl}, ${status}, ${credits ?? null}, NOW())
    ON CONFLICT (task_id) DO UPDATE SET
      media_type                  = EXCLUDED.media_type,
      blob_url                    = EXCLUDED.blob_url,
      runway_output_url_last_seen = EXCLUDED.runway_output_url_last_seen,
      runway_status                = EXCLUDED.runway_status,
      credits                      = COALESCE(EXCLUDED.credits, runway_generations.credits),
      updated_at                   = NOW()
  `;
}

async function getGenerationByTaskId(taskId) {
  await ensureGenerationsTable();
  const { rows } = await sql`SELECT * FROM runway_generations WHERE task_id = ${taskId}`;
  return rows[0] || null;
}

module.exports = {
  estimateCredits,
  checkBudget,
  getMonthlyCreditsUsed,
  recordCreditsUsed,
  submitImageToVideo,
  getTaskStatus,
  persistOutputToBlob,
  upsertGeneration,
  getGenerationByTaskId,
  MONTHLY_CREDIT_CAP,
  CREDITS_PER_SECOND_GEN45,
};
