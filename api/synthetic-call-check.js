// api/synthetic-call-check.js
// Daily Vercel Cron (see vercel.json) — places a real short outbound call via
// Vapi to catch pipeline-level failures the lightweight auth checks in
// api/health-check.js can't see. This is the check that would have caught the
// 2026-08-06 ElevenLabs key rejection immediately: that failure only ever
// surfaced as a call-time pipeline error, not as an isolated credential check.
// Protected by CRON_SECRET, same pattern as api/health-check.js.

const { recordAndAlert } = require('./_alerts');

const TEST_ASSISTANT_ID = 'ff48a258-0691-430a-a0ad-ada09b9022f9'; // Tesla
const TEST_PHONE_NUMBER_ID = '75734380-ae5a-4187-a1a6-412e2cf66cfb'; // Tesla's live Twilio number
const WAIT_MS = 60000; // give the call time to connect and actually attempt speech

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const key = process.env.VAPI_API_KEY;
  // A dedicated, unused Twilio number (+14639464699) reserved for this test only —
  // deliberately NOT ALERT_PHONE_NUMBER (Ruby's real phone), which this test used to
  // dial directly, ringing him for real every morning at the cron's scheduled time.
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
    await new Promise((resolve) => setTimeout(resolve, WAIT_MS));

    const checkRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const callData = await checkRes.json();

    const endedReason = callData.endedReason || '';
    const isPipelineError = /^pipeline-error-/.test(endedReason);
    const healthy = !isPipelineError;

    const alertResult = await recordAndAlert('synthetic-call', healthy, isPipelineError ? endedReason : null);

    res.status(200).json({
      ok: healthy,
      callId,
      status: callData.status,
      endedReason,
      ...alertResult,
    });
  } catch (err) {
    const alertResult = await recordAndAlert('synthetic-call', false, err.message);
    res.status(200).json({ ok: false, error: err.message, ...alertResult });
  }
};
