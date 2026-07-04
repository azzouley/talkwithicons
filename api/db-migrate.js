// api/db-migrate.js
// One-time admin-protected migration endpoint.
// POST /api/db-migrate with x-admin-password header creates all required tables.
// Safe to re-run — all statements use CREATE TABLE IF NOT EXISTS.

const { sql, checkAdminAuth } = require('./_db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!checkAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const results = [];

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id                       SERIAL PRIMARY KEY,
        stripe_charge_id         TEXT NOT NULL,
        stripe_payment_intent_id TEXT,
        caller_phone             TEXT,
        caller_name              TEXT,
        character_name           TEXT,
        duration_seconds         INTEGER,
        charge_cents             INTEGER,
        donation_cents           INTEGER,
        created_at               TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    results.push('transactions: ok');

    await sql`
      CREATE TABLE IF NOT EXISTS grand_tour_balances (
        access_code       TEXT PRIMARY KEY,
        purchaser_phone   TEXT,
        purchaser_name    TEXT,
        purchaser_email   TEXT,
        stripe_payment_id TEXT UNIQUE NOT NULL,
        minutes_total     INTEGER NOT NULL DEFAULT 100,
        minutes_remaining INTEGER NOT NULL DEFAULT 100,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    results.push('grand_tour_balances: ok');

    await sql`
      CREATE TABLE IF NOT EXISTS grand_tour_call_log (
        id                    SERIAL PRIMARY KEY,
        access_code           TEXT NOT NULL REFERENCES grand_tour_balances(access_code),
        caller_phone          TEXT,
        character_name        TEXT,
        duration_seconds      INTEGER,
        minutes_deducted      INTEGER,
        minutes_remaining_after INTEGER,
        vapi_call_id          TEXT,
        created_at            TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    results.push('grand_tour_call_log: ok');

    await sql`
      CREATE TABLE IF NOT EXISTS gift_balances (
        access_code       TEXT PRIMARY KEY,
        package_slug      TEXT NOT NULL,
        character_key     TEXT NOT NULL,
        minutes_total     INTEGER NOT NULL,
        minutes_remaining INTEGER NOT NULL,
        gifter_name       TEXT,
        gifter_email      TEXT,
        recipient_email   TEXT,
        stripe_payment_id TEXT UNIQUE NOT NULL,
        phone_locked_to   TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW(),
        expires_at        TIMESTAMPTZ NOT NULL
      )
    `;
    results.push('gift_balances: ok');

    await sql`
      CREATE TABLE IF NOT EXISTS gift_call_log (
        id                      SERIAL PRIMARY KEY,
        access_code             TEXT NOT NULL REFERENCES gift_balances(access_code),
        caller_phone            TEXT,
        character_name          TEXT,
        duration_seconds        INTEGER,
        minutes_deducted        INTEGER,
        minutes_remaining_after INTEGER,
        vapi_call_id            TEXT,
        created_at              TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    results.push('gift_call_log: ok');

    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    results.push('app_settings: ok');

    await sql`
      INSERT INTO app_settings (key, value)
      VALUES ('test_mode', 'false')
      ON CONFLICT (key) DO NOTHING
    `;
    results.push('app_settings seed: ok');

    await sql`
      CREATE TABLE IF NOT EXISTS donation_ledger (
        period                      TEXT PRIMARY KEY,
        total_donations_accrued     INTEGER NOT NULL DEFAULT 0,
        amount_owed_aspca           INTEGER NOT NULL DEFAULT 0,
        amount_owed_current_partner INTEGER NOT NULL DEFAULT 0,
        partner_name                TEXT,
        total_paid_aspca            INTEGER NOT NULL DEFAULT 0,
        total_paid_current_partner  INTEGER NOT NULL DEFAULT 0,
        last_payout_at              TIMESTAMPTZ,
        updated_at                  TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    results.push('donation_ledger: ok');

    return res.status(200).json({ ok: true, tables: results });
  } catch (err) {
    console.error('db-migrate error:', err.message);
    return res.status(500).json({ error: err.message, completed: results });
  }
};
