// api/health-check.js
// Hourly Vercel Cron (see vercel.json) — real auth checks against every critical
// service this project depends on. Each check performs an actual authenticated
// API call, not just "does the key exist". Alerts fire only on healthy<->broken
// transitions (see api/_alerts.js), not on every run.
// Protected by CRON_SECRET, which Vercel sends as a Bearer token on cron-triggered
// invocations (same pattern as api/reconcile-payment-intents.js).

const { recordAndAlert } = require('./_alerts');

async function checkElevenLabs() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { healthy: false, error: 'ELEVENLABS_API_KEY not configured' };
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': key },
    });
    if (res.ok) return { healthy: true };
    const text = await res.text();
    return { healthy: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

async function checkFishAudio() {
  const key = process.env.FISH_API_KEY;
  if (!key) return { healthy: false, error: 'FISH_API_KEY not configured' };
  try {
    const res = await fetch('https://api.fish.audio/wallet/self/api-credit', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) return { healthy: true };
    const text = await res.text();
    return { healthy: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

async function checkTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return { healthy: false, error: 'Twilio credentials not configured' };
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (res.ok) return { healthy: true };
    const text = await res.text();
    return { healthy: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

async function checkVapi() {
  const key = process.env.VAPI_API_KEY;
  if (!key) return { healthy: false, error: 'VAPI_API_KEY not configured' };
  try {
    const res = await fetch('https://api.vapi.ai/assistant?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) return { healthy: true };
    const text = await res.text();
    return { healthy: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const checks = {
    elevenlabs: await checkElevenLabs(),
    fishaudio: await checkFishAudio(),
    twilio: await checkTwilio(),
    vapi: await checkVapi(),
  };

  const results = {};
  for (const [service, result] of Object.entries(checks)) {
    const alertResult = await recordAndAlert(service, result.healthy, result.error);
    results[service] = { ...result, ...alertResult };
  }

  const anyBroken = Object.values(checks).some((c) => !c.healthy);
  res.status(200).json({ ok: !anyBroken, checks: results, checkedAt: new Date().toISOString() });
};
