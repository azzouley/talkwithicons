// api/synthetic-call-check.js
// Daily Vercel Cron (see vercel.json) — places a real short outbound call via
// Vapi to catch pipeline-level failures the lightweight auth checks in
// api/health-check.js can't see. This is the check that would have caught the
// 2026-08-06 ElevenLabs key rejection immediately: that failure only ever
// surfaced as a call-time pipeline error, not as an isolated credential check.
// Protected by CRON_SECRET, same pattern as api/health-check.js.
//
// A pass requires all three: the call was actually answered (startedAt set —
// far more reliable than trying to catch a narrow "in-progress" status via
// polling snapshots on a short call), Tesla's assistant produced at least one
// non-empty spoken turn (proves the LLM ran and TTS produced audio, not just
// that Vapi accepted the call-creation request), and endedReason isn't one of
// Vapi's internal pipeline-error-* codes. Audited 2026-09-22: the prior
// version only checked the third condition, so it reported healthy even when
// the call was never answered and nothing was ever said.

const { recordAndAlert } = require('./_alerts');

const TEST_ASSISTANT_ID = 'ff48a258-0691-430a-a0ad-ada09b9022f9'; // Tesla
const TEST_PHONE_NUMBER_ID = '75734380-ae5a-4187-a1a6-412e2cf66cfb'; // Tesla's live Twilio number
const MAX_WAIT_MS = 60000; // hard ceiling on total poll time
const POLL_INTERVAL_MS = 5000;

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const key = process.env.VAPI_API_KEY;
  // A free, Vapi-hosted number with a minimal "Synthetic Test Receiver"
  // assistant behind it (auto-answers, says one line, hangs up within
  // ~20s via maxDurationSeconds — see CLAUDE.md) — not a real character,
  // and deliberately not ALERT_PHONE_NUMBER (Ruby's real phone), which this
  // test used to dial directly, ringing him for real every morning.
  const testNumber = process.env.SYNTHETIC_CALL_TEST_NUMBER;
  if (!key) return res.status(500).json({ error: 'VAPI_API_KEY not configured' });
  if (!testNumber) return res.status(500).json({ error: 'SYNTHETIC_CALL_TEST_NUMBER not configured' });

  try {
    const placeRes = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assistantId: TEST_ASSISTANT_ID,
        phoneNumberId: TEST_PHONE_NUMBER_ID,
        customer: { number: testNumber },
      }),
    });
    const placeData = await placeRes.json();
    if (!placeRes.ok) {
      const detail = `Failed to place call: HTTP ${placeRes.status} ${JSON.stringify(placeData).slice(0, 150)}`;
      const alertResult = await recordAndAlert('synthetic-call', false, detail);
      return res.status(200).json({ ok: false, stage: 'placing-call', error: placeData, ...alertResult });
    }

    const callId = placeData.id;

    let callData = placeData;
    const deadline = Date.now() + MAX_WAIT_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const checkRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      callData = await checkRes.json();
      if (callData.status === 'ended') break;
    }

    const endedReason   = callData.endedReason || '';
    const isPipelineError = /^pipeline-error-/.test(endedReason);
    const wasAnswered   = !!callData.startedAt;
    const messages      = callData.messages || callData.artifact?.messages || [];
    const hasBotSpeech  = messages.some(
      (m) => m.role === 'bot' && typeof m.message === 'string' && m.message.trim().length > 0
    );

    let healthy, failStage;
    if (isPipelineError)      { healthy = false; failStage = 'pipeline-error'; }
    else if (!wasAnswered)    { healthy = false; failStage = 'never-answered'; }
    else if (!hasBotSpeech)   { healthy = false; failStage = 'no-assistant-speech'; }
    else                      { healthy = true;  failStage = null; }

    const alertDetail = failStage ? `${failStage}${endedReason ? `: ${endedReason}` : ''}` : null;
    const alertResult = await recordAndAlert('synthetic-call', healthy, alertDetail);

    res.status(200).json({
      ok: healthy,
      callId,
      status: callData.status,
      endedReason,
      wasAnswered,
      hasBotSpeech,
      failStage,
      ...alertResult,
    });
  } catch (err) {
    const alertResult = await recordAndAlert('synthetic-call', false, err.message);
    res.status(200).json({ ok: false, error: err.message, ...alertResult });
  }
};
