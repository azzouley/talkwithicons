// api/start-call.js
// Natal chart using astronomy-engine (pure JS, no native deps, serverless-safe).
// All planetary positions via Astronomy.EclipticLongitude(); ascendant via
// Astronomy.SiderealTime() + standard Meeus ASC formula.

// ── Vapi credentials (set in Vercel environment variables) ──────────────────
const VAPI_API_KEY         = process.env.VAPI_API_KEY                 || 'YOUR_VAPI_API_KEY';
const VAPI_ASSISTANT_ID    = process.env.VAPI_ASSISTANT_ID_EVANGELINE || 'YOUR_EVANGELINE_ASSISTANT_ID';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID         || 'YOUR_VAPI_PHONE_NUMBER_ID';

// ── Alert email (nodemailer / Gmail SMTP) ────────────────────────────────────
async function sendChartFailureAlert({ name, birthDate, birthTime, birthCity, error }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('GMAIL_USER/GMAIL_PASS not set — skipping alert email');
    return;
  }
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to:   'steverubenstein09@gmail.com',
      subject: 'Evangeline Chart Failure',
      text: [
        'Planet calculation failed for a caller.',
        '',
        `Caller:     ${name}`,
        `Birth Date: ${birthDate}`,
        `Birth Time: ${birthTime || 'not provided'}`,
        `Birth City: ${birthCity}`,
        '',
        `Error: ${error}`,
      ].join('\n'),
    });
    console.log('Chart failure alert email sent');
  } catch (mailErr) {
    console.error('Failed to send alert email:', mailErr.message);
  }
}

// ── astronomy-engine ──────────────────────────────────────────────────────────
let Astronomy;
try {
  Astronomy = require('astronomy-engine');
} catch (e) {
  console.error('astronomy-engine load error:', e.message);
}

const { lookupCity } = require('./cities');
const { sql, normalizePhone: dbNormalizePhone } = require('./_db');

// ── Constants ─────────────────────────────────────────────────────────────────
const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const ASPECTS = [
  { name: 'conjunct',   angle:   0, orb: 8 },
  { name: 'sextile',    angle:  60, orb: 5 },
  { name: 'square',     angle:  90, orb: 7 },
  { name: 'trine',      angle: 120, orb: 7 },
  { name: 'opposition', angle: 180, orb: 8 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function norm360(deg) {
  return ((deg % 360) + 360) % 360;
}

// Convert ecliptic longitude (degrees, 0–360) to sign name, degree within sign, and minutes
function lonToPosition(lonDeg) {
  const l        = norm360(lonDeg);
  const signIdx  = Math.floor(l / 30);
  const degInSign = l % 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return {
    sign:    SIGNS[signIdx],
    degree:  d,
    minutes: m,
    label:   `${SIGNS[signIdx]} ${d}°${m.toString().padStart(2, '0')}'`,
    lon:     l,
  };
}

// Parse "YYYY-MM-DD" + optional "HH:MM" (24-hour) into a UTC Date.
// Birth time is treated as local solar time — standard natal chart practice.
function parseBirthDate(birthDateStr, birthTime) {
  const [yr, mo, dy] = birthDateStr.split('-').map(Number);
  let hour = 12; // default noon if time unknown
  if (birthTime) {
    const parts = birthTime.split(':').map(Number);
    hour = parts[0] + (parts[1] || 0) / 60;
    console.log('parseBirthDate — raw:', birthTime, '| H:', parts[0], 'M:', parts[1], '| decimal hour:', hour.toFixed(4));
  } else {
    console.log('parseBirthDate — no birthTime, defaulting to noon');
  }
  const h = Math.floor(hour);
  const min = Math.round((hour - h) * 60);
  return new Date(Date.UTC(yr, mo - 1, dy, h, min));
}

// ── Planet positions via astronomy-engine ─────────────────────────────────────
// EclipticLongitude() is heliocentric and throws for Sun — do not use it.
// Sun:  SunPosition() → geocentric apparent ecliptic longitude (.elon)
// Moon: EclipticGeoMoon() → geocentric ecliptic longitude (.lon)
// Planets: GeoVector() [geocentric equatorial J2000] → Ecliptic() → .elon
function getAllPlanetPositions(date) {
  function geoEclLon(body) {
    const vec = Astronomy.GeoVector(body, date, true);
    return Astronomy.Ecliptic(vec).elon;
  }

  return {
    Sun:     lonToPosition(Astronomy.SunPosition(date).elon),
    Moon:    lonToPosition(Astronomy.EclipticGeoMoon(date).lon),
    Mercury: lonToPosition(geoEclLon(Astronomy.Body.Mercury)),
    Venus:   lonToPosition(geoEclLon(Astronomy.Body.Venus)),
    Mars:    lonToPosition(geoEclLon(Astronomy.Body.Mars)),
    Jupiter: lonToPosition(geoEclLon(Astronomy.Body.Jupiter)),
    Saturn:  lonToPosition(geoEclLon(Astronomy.Body.Saturn)),
    Uranus:  lonToPosition(geoEclLon(Astronomy.Body.Uranus)),
    Neptune: lonToPosition(geoEclLon(Astronomy.Body.Neptune)),
    Pluto:   lonToPosition(geoEclLon(Astronomy.Body.Pluto)),
  };
}

// ── Ascendant and Equal house cusps ──────────────────────────────────────────
// GAST from astronomy-engine; obliquity via standard Meeus formula.
function calcAscendantAndHouses(date, latDeg, lonDeg) {
  try {
    const D2R = Math.PI / 180;
    const R2D = 180 / Math.PI;

    // GAST (sidereal hours → degrees) + geographic longitude → LST
    const gastHours = Astronomy.SiderealTime(date);
    const lst       = norm360(gastHours * 15 + lonDeg);

    // Mean obliquity (degrees) — Meeus formula, accurate to ~0.001° for modern dates
    const jd  = date.getTime() / 86400000 + 2440587.5;
    const T   = (jd - 2451545.0) / 36525.0;
    const eps = 23.439291111 - 0.013004167 * T - 0.00000016389 * T * T + 0.00000050361 * T * T * T;

    const lstR = lst * D2R;
    const epsR = eps * D2R;
    const latR = latDeg * D2R;

    // Ascendant (standard formula — Meeus ch. 14)
    const ascR   = Math.atan2(-Math.cos(lstR), Math.sin(lstR) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR));
    const ascDeg = norm360(ascR * R2D);
    const asc    = lonToPosition(ascDeg);

    // Midheaven (MC) with quadrant correction
    const mcR  = Math.atan2(Math.sin(lstR), Math.cos(lstR) * Math.cos(epsR));
    let mcDeg  = norm360(mcR * R2D);
    if (Math.abs(norm360(mcDeg - ascDeg)) < 90) mcDeg = norm360(mcDeg + 180);
    const mc   = lonToPosition(mcDeg);

    // Equal house cusps: 12 cusps each 30° from the Ascendant
    const houses = [];
    for (let i = 0; i < 12; i++) houses.push(lonToPosition(norm360(ascDeg + i * 30)));

    return { asc, mc, houses };
  } catch (err) {
    console.error('Ascendant calculation error:', err.message);
    return null;
  }
}

// ── Transit aspects ───────────────────────────────────────────────────────────
function getTransitAspects(natal, current) {
  const lines       = [];
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

  for (const transitPlanet of planetNames) {
    const tPos = current[transitPlanet];
    if (tPos.lon === null) continue;

    for (const natalPlanet of planetNames) {
      const nPos = natal[natalPlanet];
      if (nPos.lon === null) continue;

      const diff  = Math.abs(norm360(tPos.lon - nPos.lon));
      const angle = diff > 180 ? 360 - diff : diff;

      for (const asp of ASPECTS) {
        if (Math.abs(angle - asp.angle) <= asp.orb) {
          lines.push(`Transit ${transitPlanet} (${tPos.label}) ${asp.name} natal ${natalPlanet} (${nPos.label})`);
          break;
        }
      }
    }
  }

  return lines.length > 0 ? lines : ['No major transit aspects within orb today.'];
}

// Convert 24-hour "HH:MM" to human-friendly "H:MM AM/PM"
function formatBirthTime(t) {
  if (!t) return null;
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const m    = mStr || '00';
  const ampm = h < 12 ? 'AM' : 'PM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

// ── Build the full natal chart summary injected into the Vapi prompt ─────────
async function buildNatalSummary({ name, birthDate, birthTime, birthCity }) {
  if (!Astronomy) {
    return `[Natal chart unavailable — astronomy-engine failed to load. Proceed with name: ${name}, birth date: ${birthDate}, birth city: ${birthCity}.]`;
  }

  const friendlyTime = formatBirthTime(birthTime);
  const timeNote = friendlyTime
    ? `Birth time ${friendlyTime} was provided.`
    : 'No birth time was provided — Ascendant and house positions are approximate (defaulted to noon). Ask if the caller can find their exact birth time.';

  const bDate   = parseBirthDate(birthDate, birthTime);
  const nowDate = new Date();

  const PLANET_UNKNOWN   = { label: '[calculation failed]', sign: 'unknown', lon: null };
  const PLANETS_FALLBACK = Object.fromEntries(
    ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']
      .map(p => [p, PLANET_UNKNOWN])
  );

  let natal          = PLANETS_FALLBACK;
  let current        = PLANETS_FALLBACK;
  let transitAspects = ['Transit aspects unavailable — planet calculation failed.'];

  try {
    natal          = getAllPlanetPositions(bDate);
    current        = getAllPlanetPositions(nowDate);
    transitAspects = getTransitAspects(natal, current);
  } catch (err) {
    console.error('Planet calculation failed:', err.message);
    await sendChartFailureAlert({ name, birthDate, birthTime, birthCity, error: err.message });
  }

  const coords = lookupCity(birthCity);
  let ascBlock = '';
  let ascSign  = 'unknown — ask the caller';

  if (coords) {
    let result = null;
    try {
      result = calcAscendantAndHouses(bDate, coords.lat, coords.lon);
    } catch (err) {
      console.error('Ascendant calculation threw:', err.message);
    }
    if (result) {
      ascSign  = result.asc.sign;
      ascBlock = `
ASCENDANT & HOUSES (Equal House system, birth coordinates: ${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°)
Ascendant (Rising): ${result.asc.label}
Midheaven (MC):     ${result.mc.label}
House Cusps:
${result.houses.map((h, i) => `  House ${(i + 1).toString().padStart(2)}: ${h.label}`).join('\n')}`;
    } else {
      ascSign  = 'unknown (birth time required for accurate calculation)';
      ascBlock = `\nASCENDANT & HOUSES: Calculation failed — a precise birth time is needed for an accurate ascendant and house cusps. Ask the caller if they know their rising sign.`;
    }
  } else {
    ascBlock = `\nASCENDANT & HOUSES: Birth city "${birthCity}" not found in coordinate table — Ascendant and house cusps could not be calculated. Ask the caller if they know their rising sign, or invite them to look up the coordinates (lat/lon) of their birth city.`;
  }

  return `NATAL CHART — ${name.toUpperCase()}
${'='.repeat(50)}
Birth Date:  ${birthDate}
Birth Time:  ${friendlyTime || 'unknown (defaulted to noon)'}
Birth City:  ${birthCity}
${timeNote}

NATAL PLANET POSITIONS
Sun:     ${natal.Sun.label}
Moon:    ${natal.Moon.label}
Mercury: ${natal.Mercury.label}
Venus:   ${natal.Venus.label}
Mars:    ${natal.Mars.label}
Jupiter: ${natal.Jupiter.label}
Saturn:  ${natal.Saturn.label}
Uranus:  ${natal.Uranus.label}
Neptune: ${natal.Neptune.label}
Pluto:   ${natal.Pluto.label}
${ascBlock}

CURRENT TRANSITS (today vs natal)
${transitAspects.join('\n')}

READING INSTRUCTIONS
- Address the caller by name (${name}) immediately.
- Lead with the Sun sign (${natal.Sun.sign}) and Moon sign (${natal.Moon.sign}).
- Ascendant is ${ascSign}.
- Reference the most striking current transit aspect early.
- Moon sign and rising shape the emotional tone — use them.
- This is a conversation, not a monologue. Ask questions and follow threads.
- Do not invent planetary positions — use only the data provided above.`.trim();
}

// ── Stripe helper ─────────────────────────────────────────────────────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

// ── Phone normalizer ──────────────────────────────────────────────────────────
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits;
}

// ── Vercel serverless handler ─────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name: nameRaw, phoneNumber, birthDate, birthTime, birthCity, language, paymentIntentId, stripeCustomerId, giftCode } = req.body || {};
  const name = (nameRaw || '').trim();
  console.log('birthTime received:', birthTime, 'type:', typeof birthTime, 'length:', birthTime?.length);
  if (!name || !phoneNumber || !birthDate || !birthCity) {
    return res.status(400).json({ error: 'name, phoneNumber, birthDate, and birthCity are required' });
  }
  const lang = (language === 'es') ? 'es' : 'en';

  // ── Gift code path (bypasses Stripe entirely) ─────────────────────────────────
  let resolvedGiftCode = null;
  if (giftCode) {
    const code  = giftCode.trim().toUpperCase();
    const phone = dbNormalizePhone(phoneNumber);
    try {
      const result = await sql`
        SELECT access_code, character_key, phone_locked_to, minutes_remaining, expires_at
        FROM gift_balances WHERE access_code = ${code}
      `;
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Gift code not found' });
      }
      const row = result.rows[0];
      if (row.character_key !== 'evangeline') {
        return res.status(403).json({ error: 'This gift code is not valid for Evangeline' });
      }
      if (new Date(row.expires_at) < new Date()) {
        return res.status(403).json({ error: 'This gift code has expired' });
      }
      if (row.phone_locked_to && row.phone_locked_to !== phone) {
        return res.status(403).json({ error: 'Phone number does not match this gift code' });
      }
      if (row.minutes_remaining < 5) {
        return res.status(403).json({
          error: 'Insufficient minutes remaining on this gift code',
          minutesRemaining: row.minutes_remaining,
        });
      }
      if (!row.phone_locked_to) {
        await sql`
          UPDATE gift_balances SET phone_locked_to = ${phone}, updated_at = NOW()
          WHERE access_code = ${code}
        `;
      }
      resolvedGiftCode = code;
    } catch (dbErr) {
      console.error('start-call gift code validation error:', dbErr.message);
      return res.status(500).json({ error: 'Gift code validation failed' });
    }
  }

  // ── Stripe auth hold verification (same flow as start-call-basic) ────────────
  let paymentMethodId = null;

  if (!resolvedGiftCode) {
    if (process.env.STRIPE_SECRET_KEY) {
      if (!paymentIntentId) {
        return res.status(402).json({ error: 'Payment authorization required' });
      }
      try {
        const stripe = getStripe();
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (pi.status !== 'requires_capture') {
          return res.status(402).json({
            error: 'Payment authorization not confirmed',
            status: pi.status,
          });
        }

        paymentMethodId = typeof pi.payment_method === 'string'
          ? pi.payment_method
          : pi.payment_method?.id || null;
      } catch (err) {
        console.error('Stripe PI verification error:', err.message);
        return res.status(502).json({ error: 'Payment verification failed', detail: err.message });
      }
    }
  }

  let natalSummary;
  try {
    natalSummary = await buildNatalSummary({ name, birthDate, birthTime, birthCity });
  } catch (err) {
    console.error('Chart calculation error:', err);
    natalSummary = `[Chart calculation failed: ${err.message}. Proceed with name: ${name}, birth date: ${birthDate}, birth city: ${birthCity}.]`;
  }

  const vapiPayload = {
    phoneNumberId: VAPI_PHONE_NUMBER_ID,
    customer: { number: normalizePhone(phoneNumber), name },
    assistantId: VAPI_ASSISTANT_ID,
    assistantOverrides: {
      variableValues: {
        callerName: name,
        natalChart: natalSummary,
        language:   lang,
      },
    },
    metadata: resolvedGiftCode ? { giftCode: resolvedGiftCode, language: lang } :
              paymentIntentId  ? {
                paymentIntentId,
                paymentMethodId:  paymentMethodId || '',
                stripeCustomerId: stripeCustomerId || '',
                language:         lang,
              } : { language: lang },
  };

  console.log('start-call:', 'callerName:', name, '| lang:', lang, '| birthDate:', birthDate);
  try {
    const vapiRes  = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' },
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
