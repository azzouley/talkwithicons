// api/_runway.js — shared Runway API client + monthly credit-budget tracking
// Underscore prefix: excluded from Vercel routing (not a public endpoint).
//
// Verified directly against the live API (not assumed from docs) on 2026-08-09:
// POST /v1/image_to_video -> {id, estimatedCost:{credits}}
// GET  /v1/tasks/{id}     -> {status:"RUNNING"|"SUCCEEDED"|"FAILED"|..., progress, output:[url], cost:{credits}}
// gen4.5 costs 60 credits per 5s clip = 12 credits/sec, confirmed via a real generation.

const { sql, getCurrentPeriod } = require('./_db');

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

module.exports = {
  estimateCredits,
  checkBudget,
  getMonthlyCreditsUsed,
  recordCreditsUsed,
  submitImageToVideo,
  getTaskStatus,
  MONTHLY_CREDIT_CAP,
  CREDITS_PER_SECOND_GEN45,
};
