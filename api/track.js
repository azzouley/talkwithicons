// api/track.js
// Records call-form funnel events from the shared /funnel.js script into
// funnel_events (see migrations/004). Public and unauthenticated by design,
// so it accepts only a fixed event list and truncates every field.

const { sql } = require('./_db');

const ALLOWED_EVENTS = new Set(['form_started', 'form_submitted']);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  // navigator.sendBeacon posts text/plain, so the body may arrive unparsed.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const event = String(body.event || '');
  if (!ALLOWED_EVENTS.has(event)) return res.status(400).json({ error: 'unknown event' });
  const page = String(body.page || '').slice(0, 100);
  const sessionId = String(body.sessionId || '').slice(0, 40) || null;

  try {
    await sql`
      INSERT INTO funnel_events (event, page, session_id)
      VALUES (${event}, ${page}, ${sessionId})
    `;
    return res.status(204).end();
  } catch (err) {
    console.error('track insert error', err.message);
    return res.status(500).json({ error: 'insert failed' });
  }
};
