// api/_alerts.js — shared SMS alerting + state-transition tracking for health checks
// Underscore prefix: excluded from Vercel routing (not a public endpoint).

const { sql } = require('@vercel/postgres');

async function ensureHealthCheckTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS health_check_state (
      service TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_error TEXT
    )
  `;
}

async function sendSms(body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.ALERT_FROM_NUMBER;
  const to = process.env.ALERT_PHONE_NUMBER;
  if (!sid || !token || !from || !to) {
    console.error('Alert SMS not configured, skipping. body:', body);
    return { skipped: true };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: to, Body: body }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Alert SMS failed:', JSON.stringify(data));
      return { ok: false, error: data };
    }
    return { ok: true, sid: data.sid };
  } catch (err) {
    console.error('Alert SMS threw:', err.message);
    return { ok: false, error: err.message };
  }
}

// Compares the last known status for `service` against `isHealthy`. Fires an SMS
// only on a genuine transition (healthy->broken or broken->healthy) - never on
// repeated checks of the same state, and never on the very first check ever
// recorded for a service (avoids an alert storm the moment this system deploys).
async function recordAndAlert(service, isHealthy, errorDetail) {
  await ensureHealthCheckTable();
  const newStatus = isHealthy ? 'healthy' : 'broken';

  const { rows } = await sql`SELECT status FROM health_check_state WHERE service = ${service}`;
  const previousStatus = rows[0]?.status || null;
  const isFirstCheck = previousStatus === null;
  const transitioned = !isFirstCheck && previousStatus !== newStatus;

  await sql`
    INSERT INTO health_check_state (service, status, last_checked_at, last_changed_at, last_error)
    VALUES (${service}, ${newStatus}, NOW(), NOW(), ${errorDetail || null})
    ON CONFLICT (service) DO UPDATE SET
      last_changed_at = CASE WHEN health_check_state.status != ${newStatus} THEN NOW() ELSE health_check_state.last_changed_at END,
      status = ${newStatus},
      last_checked_at = NOW(),
      last_error = ${errorDetail || null}
  `;

  if (transitioned) {
    const time = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true,
    });
    if (newStatus === 'broken') {
      await sendSms(`TalkWithIcons alert: ${service} failed at ${time} ET — calls may be broken. ${(errorDetail || '').slice(0, 100)}`);
    } else {
      await sendSms(`TalkWithIcons: ${service} recovered at ${time} ET.`);
    }
  }

  return { transitioned, previousStatus, isFirstCheck };
}

module.exports = { sendSms, recordAndAlert, ensureHealthCheckTable };
