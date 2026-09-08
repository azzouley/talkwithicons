// api/call-status.js
// Polled by the frontend after a call is placed, so the caller sees real status
// (dialing / ringing / connected / ended) instead of a single static message
// that never updates for the rest of the call.

const VAPI_API_KEY = process.env.VAPI_API_KEY || 'YOUR_VAPI_API_KEY';

// endedReason values that mean the call genuinely failed to reach anyone,
// as distinct from a normal completed call (which may still have gone to
// voicemail — Vapi doesn't reliably distinguish that from a real answer).
const FAILURE_REASONS = new Set([
  'twilio-failed-to-connect-call',
  'twilio-reported-call-failed',
  'phone-call-provider-closed-websocket',
  'silence-timed-out',
  'no-answer',
  'customer-did-not-answer',
]);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { callId } = req.query || {};
  if (!callId) return res.status(400).json({ error: 'callId is required' });

  try {
    const vapiRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
    });
    const call = await vapiRes.json();
    if (!vapiRes.ok) {
      return res.status(502).json({ error: 'Call service error', detail: call });
    }

    const status      = call.status || 'unknown';
    const endedReason  = call.endedReason || null;
    const startedAt    = call.startedAt ? new Date(call.startedAt).getTime() : null;
    const endedAt      = call.endedAt ? new Date(call.endedAt).getTime() : null;
    const durationSecs = (startedAt && endedAt) ? Math.round((endedAt - startedAt) / 1000) : null;

    let phase, message;
    if (status === 'queued') {
      phase = 'dialing';
      message = 'Dialing your phone...';
    } else if (status === 'ringing') {
      phase = 'ringing';
      message = "Ringing — pick up when you're ready.";
    } else if (status === 'in-progress' || status === 'forwarding') {
      phase = 'connected';
      message = 'Connected — enjoy your conversation!';
    } else if (status === 'ended') {
      if (endedReason && FAILURE_REASONS.has(endedReason)) {
        phase = 'failed';
        message = "We couldn't connect the call. Please check your number and try again.";
      } else if (durationSecs !== null && durationSecs < 15) {
        phase = 'ended-short';
        message = `Call ended after ${durationSecs}s. If this went to voicemail or you missed it, feel free to call again.`;
      } else {
        phase = 'ended';
        message = 'Call ended. Thanks for calling!';
      }
    } else {
      phase = 'unknown';
      message = 'Connecting...';
    }

    return res.status(200).json({ status, phase, message, endedReason, durationSecs });
  } catch (err) {
    console.error('call-status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
