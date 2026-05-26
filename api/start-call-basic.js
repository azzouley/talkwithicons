// api/start-call-basic.js
// Outbound call trigger for the 8 non-Evangeline characters.
// Takes firstName + phoneNumber + character, injects callerName via variableValues.
// Each character's Vapi assistant must have {{callerName}} in their system prompt.

// ── Shared Vapi credentials ───────────────────────────────────────────────────
const VAPI_API_KEY         = process.env.VAPI_API_KEY         || 'YOUR_VAPI_API_KEY';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID || 'YOUR_VAPI_PHONE_NUMBER_ID';

// ── Per-character Vapi assistant IDs (set each in Vercel environment variables) ─
const ASSISTANT_IDS = {
  einstein:    process.env.VAPI_ASSISTANT_ID_EINSTEIN    || 'YOUR_EINSTEIN_ASSISTANT_ID',
  nostradamus: process.env.VAPI_ASSISTANT_ID_NOSTRADAMUS || 'YOUR_NOSTRADAMUS_ASSISTANT_ID',
  twain:       process.env.VAPI_ASSISTANT_ID_TWAIN       || 'YOUR_TWAIN_ASSISTANT_ID',
  tesla:       process.env.VAPI_ASSISTANT_ID_TESLA       || 'YOUR_TESLA_ASSISTANT_ID',
  holmes:      process.env.VAPI_ASSISTANT_ID_HOLMES      || 'YOUR_HOLMES_ASSISTANT_ID',
  aela:        process.env.VAPI_ASSISTANT_ID_AELA        || 'YOUR_AELA_ASSISTANT_ID',
  bennet:      process.env.VAPI_ASSISTANT_ID_BENNET      || 'YOUR_BENNET_ASSISTANT_ID',
  curie:       process.env.VAPI_ASSISTANT_ID_CURIE       || 'YOUR_CURIE_ASSISTANT_ID',
};

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, phoneNumber, character } = req.body || {};
  if (!firstName || !phoneNumber || !character) {
    return res.status(400).json({ error: 'firstName, phoneNumber, and character are required' });
  }

  const assistantId = ASSISTANT_IDS[character.toLowerCase()];
  if (!assistantId || assistantId.startsWith('YOUR_')) {
    return res.status(400).json({ error: `Character "${character}" is not yet configured` });
  }

  const vapiPayload = {
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer:      { number: normalizePhone(phoneNumber), name: firstName },
    assistantId,
    assistantOverrides: {
      variableValues: { callerName: firstName },
    },
  };

  try {
    const vapiRes  = await fetch('https://api.vapi.ai/call', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiPayload),
    });
    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      console.error('Vapi error:', vapiData);
      return res.status(502).json({ error: 'Call service error', detail: vapiData });
    }

    return res.status(200).json({ success: true, callId: vapiData.id });
  } catch (err) {
    console.error('start-call-basic error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
