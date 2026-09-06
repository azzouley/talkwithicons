// api/_runway.js — shared Runway API client + monthly credit-budget tracking
// Underscore prefix: excluded from Vercel routing (not a public endpoint).
//
// Verified directly against the live API (not assumed from docs) on 2026-08-09:
// POST /v1/image_to_video -> {id, estimatedCost:{credits}}
// GET  /v1/tasks/{id}     -> {status:"RUNNING"|"SUCCEEDED"|"FAILED"|..., progress, output:[url], cost:{credits}}
// gen4.5 costs 60 credits per 5s clip = 12 credits/sec, confirmed via a real generation.
//
// Verified directly against the live API on 2026-08-31 (Vincent portrait build):
// POST /v1/text_to_image {model:"gen4_image", promptText, ratio} -> {id, estimatedCost:{credits}}
// Same /v1/tasks/{id} polling as image_to_video. A 1024:1024 test probe cost 8 credits.

const { sql, getCurrentPeriod } = require('./_db');
const { put } = require('@vercel/blob');

const RUNWAY_BASE = 'https://api.dev.runwayml.com';
const RUNWAY_VERSION = '2024-11-06';
const CREDITS_PER_SECOND_GEN45 = 12; // derived from a real 5s clip costing 60 credits

// NOTE on the two different Runway numbers, easy to conflate (and previously
// conflated in this file — corrected 2026-09-04):
//   - maxMonthlyCreditSpend: a RATE ceiling on the API account's tier (how much
//     can be spent on credits in a rolling 30-day window; currently $100 =
//     10,000 credits at Tier 1). This is NOT the same thing as a subscription
//     plan and is not what limits production day-to-day right now.
//   - creditBalance: the account's actual real remaining prepaid credits —
//     this is the number that runs out. TWI is API-only (RUNWAY_API_KEY),
//     billed separately from any Runway consumer monthly plan; the rate
//     ceiling above is rarely the binding constraint, balance is.
// checkBudget() below gates against live creditBalance, not a local
// monthly-reset counter — a hardcoded local cap silently drifts from the
// real account state (confirmed 2026-09-04: local ledger read 2,282 for
// September while a real generation had already landed that was never
// recorded, and the true remaining balance was 565 — nothing in the local
// ledger would have caught that a real exhaustion was imminent).

function runwayHeaders(extra) {
  const key = process.env.RUNWAY_API_KEY;
  return {
    Authorization: `Bearer ${key}`,
    'X-Runway-Version': RUNWAY_VERSION,
    ...extra,
  };
}

async function getCreditBalance() {
  const res = await fetch(`${RUNWAY_BASE}/v1/organization`, { headers: runwayHeaders() });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`Runway organization fetch failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return {
    creditBalance: data.creditBalance,
    maxMonthlyCreditSpend: data.tier?.maxMonthlyCreditSpend ?? null,
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

async function ensureCreditEventsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS runway_credit_events (
      task_id TEXT PRIMARY KEY,
      credits INTEGER NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// Idempotent per-task recorder — safe to call on every status poll of a
// SUCCEEDED task, or once at submission time, without double-counting.
// This is what closes both known gaps: (1) a caller submitting a task and
// never separately calling recordCreditsUsed, and (2) the pre-existing bug
// where polling ?action=status on an already-succeeded task re-added its
// cost to the ledger on every single poll.
async function recordCreditsOnce(taskId, credits) {
  if (!taskId || !credits) return false;
  await ensureCreditEventsTable();
  const { rows } = await sql`
    INSERT INTO runway_credit_events (task_id, credits)
    VALUES (${taskId}, ${credits})
    ON CONFLICT (task_id) DO NOTHING
    RETURNING task_id
  `;
  if (rows.length === 0) return false; // already recorded for this task
  await recordCreditsUsed(credits);
  return true;
}

// Local pre-flight estimate so a request can be blocked BEFORE calling Runway at
// all, rather than after Runway has already committed the spend.
function estimateCredits(durationSeconds) {
  return Math.ceil(durationSeconds * CREDITS_PER_SECOND_GEN45);
}

async function checkBudget(estimatedCredits) {
  const { creditBalance, maxMonthlyCreditSpend } = await getCreditBalance();
  return {
    allowed: estimatedCredits <= creditBalance,
    creditBalance,
    remainingAfter: creditBalance - estimatedCredits,
    maxMonthlyCreditSpend, // informational rate ceiling only, not the gate
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
  // Auto-record at submission time using Runway's own estimatedCost — closes
  // the gap where a caller submits a task but forgets the separate manual
  // recordCreditsUsed() call afterward (confirmed happening 2026-09-04: a
  // real 108-credit generation went unrecorded in the local ledger). Uses
  // the idempotent per-task recorder so this can't double-count against a
  // later terminal-status recording of the same task's actual cost.
  if (data.id && data.estimatedCost?.credits) {
    await recordCreditsOnce(data.id, data.estimatedCost.credits).catch(() => {}); // best-effort; live balance check is the real gate, not this
  }
  return data; // {id, estimatedCost:{credits}}
}

async function submitTextToImage({ promptText, ratio, referenceImages }) {
  const res = await fetch(`${RUNWAY_BASE}/v1/text_to_image`, {
    method: 'POST',
    headers: runwayHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      model: 'gen4_image',
      promptText,
      ratio: ratio || '1024:1024',
      ...(referenceImages ? { referenceImages } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(`Runway text_to_image task creation failed: HTTP ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
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
  getCreditBalance,
  getMonthlyCreditsUsed, // kept: our own submission history, NOT a budget gate — see note above getCreditBalance()
  recordCreditsUsed,
  recordCreditsOnce,
  submitImageToVideo,
  submitTextToImage,
  getTaskStatus,
  persistOutputToBlob,
  upsertGeneration,
  getGenerationByTaskId,
  CREDITS_PER_SECOND_GEN45,
};
