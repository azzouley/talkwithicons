// api/start-call.js
// Accepts POST { name, phone, birthDate, birthTime, birthCity }
// Calculates sun sign from birth date, builds natal chart summary,
// then calls the Vapi API to initiate an outbound call with
// Evangeline Adams as the assistant and the chart data injected.

const VAPI_API_KEY            = process.env.VAPI_API_KEY                    || 'YOUR_VAPI_API_KEY';
const VAPI_ASSISTANT_ID       = process.env.VAPI_ASSISTANT_ID_EVANGELINE    || 'YOUR_EVANGELINE_ASSISTANT_ID';
const VAPI_PHONE_NUMBER_ID    = process.env.VAPI_PHONE_NUMBER_ID            || 'YOUR_VAPI_PHONE_NUMBER_ID';

// ─── Sun sign lookup ────────────────────────────────────────────────────────
// Each entry: the sign begins on start[0] (month) / start[1] (day).
// Listed in reverse so the first match walking backward wins.
const ZODIAC = [
  { sign: 'Capricorn',   start: [12, 22] },
  { sign: 'Aquarius',    start: [1,  20] },
  { sign: 'Pisces',      start: [2,  19] },
  { sign: 'Aries',       start: [3,  21] },
  { sign: 'Taurus',      start: [4,  20] },
  { sign: 'Gemini',      start: [5,  21] },
  { sign: 'Cancer',      start: [6,  21] },
  { sign: 'Leo',         start: [7,  23] },
  { sign: 'Virgo',       start: [8,  23] },
  { sign: 'Libra',       start: [9,  23] },
  { sign: 'Scorpio',     start: [10, 23] },
  { sign: 'Sagittarius', start: [11, 22] },
];

function getSunSign(month, day) {
  for (let i = ZODIAC.length - 1; i >= 0; i--) {
    const [m, d] = ZODIAC[i].start;
    if (month > m || (month === m && day >= d)) return ZODIAC[i].sign;
  }
  return 'Capricorn'; // Dec 22–Jan 19 wraps back to Capricorn
}

// ─── Natal chart summary ─────────────────────────────────────────────────────
// Full moon sign and ascendant calculation requires a planetary ephemeris and
// geocoded birth coordinates. Inject what we have; prompt Evangeline to probe
// for birth time precision if it was not provided.
function buildNatalSummary({ name, birthDate, birthTime, birthCity }) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const sunSign = getSunSign(month, day);
  const timeNote = birthTime
    ? `Birth time ${birthTime} was provided — use this when discussing the ascendant and house placements.`
    : 'No birth time was provided. Note this early and ask if the caller can find it — it significantly affects the ascendant and house positions.';

  return `CALLER BIRTH DATA
===================
Name:        ${name}
Birth Date:  ${month}/${day}/${year}
Birth Time:  ${birthTime || 'not provided'}
Birth City:  ${birthCity}
Sun Sign:    ${sunSign}

READING INSTRUCTIONS
- Address the caller by name (${name}) immediately.
- Open by acknowledging their Sun sign (${sunSign}) and what you see in it.
- ${timeNote}
- Their birth city is ${birthCity} — reference this in the geographic context of their chart.
- Moon sign and full house placements require ephemeris data; probe with questions rather than stating uncertain positions as fact.
- This is a conversation, not a monologue. Ask questions, follow threads, respond to what the caller brings.`.trim();
}

// ─── Phone normalizer ────────────────────────────────────────────────────────
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, birthDate, birthTime, birthCity } = req.body || {};

  if (!name || !phone || !birthDate || !birthCity) {
    return res.status(400).json({
      error: 'name, phone, birthDate, and birthCity are required',
    });
  }

  const natalSummary = buildNatalSummary({ name, birthDate, birthTime, birthCity });
  const formattedPhone = normalizePhone(phone);

  const vapiPayload = {
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer: {
      number: formattedPhone,
      name,
    },
    assistantId: VAPI_ASSISTANT_ID,
    assistantOverrides: {
      variableValues: {
        callerName: name,
        natalChart: natalSummary,
      },
    },
  };

  try {
    const vapiRes = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
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
    console.error('start-call handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
