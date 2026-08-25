// ============================================================================
// api/_log-call.js
// Single responsibility: write one durable row to the `calls` table.
//
// Design rules:
//  - NEVER throw into the caller. A logging failure must not break a call or a
//    Stripe charge. All errors are caught and logged; the function resolves.
//  - Idempotent on vapi_call_id via ON CONFLICT, because Vapi's end webhook can
//    fire more than once for the same call (the same reason the payment
//    reconciliation cron exists).
//  - Reuses the app's existing pg pool if one is passed; otherwise creates a
//    short-lived client. Prefer passing the pool from call-ended.js.
//
// Usage from call-ended.js (see integration snippet):
//   const { logCall } = require('./_log-call');
//   await logCall({ ... }, pool);   // pool optional
// ============================================================================

const { Client } = require('pg');

function toMinutes(seconds) {
  if (!seconds || seconds < 0) return 0;
  return Math.round((seconds / 60) * 100) / 100; // 2 dp
}

/**
 * @param {Object} c
 * @param {string} c.characterName   required, e.g. 'Aela'
 * @param {string} [c.assistantId]
 * @param {string} [c.phoneNumberId]
 * @param {string} [c.vapiCallId]
 * @param {number} [c.durationSeconds]
 * @param {boolean}[c.reachedGate]
 * @param {boolean}[c.converted]
 * @param {string} [c.endedReason]
 * @param {number} [c.revenueCents]
 * @param {number} [c.donationCents]
 * @param {string} [c.callType]       'standard' | 'gift' | 'tour'
 * @param {string} [c.transactionId]
 * @param {Object} [c.raw]            raw webhook payload
 * @param {Object} [pool]            optional existing pg Pool with .query()
 */
async function logCall(c, pool) {
  // vapi_call_id is NOT NULL in the schema and is the upsert key. Vapi always
  // sends one on the end webhook; synthesize a stable-ish fallback if missing so
  // a row is never dropped and the unique constraint still holds.
  const callId = c.vapiCallId
    || `nocallid_${(c.characterName || 'unknown').toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const params = [
    c.characterName || 'Unknown',
    c.assistantId || null,
    c.phoneNumberId || null,
    callId,
    Math.round(c.durationSeconds || 0),
    toMinutes(c.durationSeconds),
    !!c.reachedGate,
    !!c.converted,
    c.endedReason || null,
    Math.round(c.revenueCents || 0),
    Math.round(c.donationCents || 0),
    c.callType || 'standard',
    c.transactionId || null,
    c.raw ? JSON.stringify(c.raw) : null,
  ];

  const sql = `
    INSERT INTO calls
      (character_name, assistant_id, phone_number_id, vapi_call_id,
       duration_seconds, duration_minutes, reached_gate, converted,
       ended_reason, revenue_cents, donation_cents, call_type,
       transaction_id, raw)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    ON CONFLICT (vapi_call_id)
    DO UPDATE SET
       duration_seconds = EXCLUDED.duration_seconds,
       duration_minutes = EXCLUDED.duration_minutes,
       reached_gate     = EXCLUDED.reached_gate,
       converted        = EXCLUDED.converted,
       ended_reason     = EXCLUDED.ended_reason,
       revenue_cents    = EXCLUDED.revenue_cents,
       donation_cents   = EXCLUDED.donation_cents,
       transaction_id   = COALESCE(EXCLUDED.transaction_id, calls.transaction_id),
       raw              = EXCLUDED.raw
  `;

  // Path 1: reuse the app's pool (preferred — no new connection).
  if (pool && typeof pool.query === 'function') {
    try {
      await pool.query(sql, params);
    } catch (err) {
      console.error('[logCall] non-fatal: pool insert failed:', err.message);
    }
    return;
  }

  // Path 2: short-lived client if no pool was passed.
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[logCall] non-fatal: no pool and no DATABASE_URL; skipping log.');
    return;
  }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql, params);
  } catch (err) {
    console.error('[logCall] non-fatal: client insert failed:', err.message);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

module.exports = { logCall, toMinutes };
