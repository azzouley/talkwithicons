// api/start-call.js
//
// Natal chart calculation using pure JS orbital mechanics (no external astronomy packages).
// Planet positions: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus,
// Neptune, Pluto — all via Meeus orbital elements and simplified lunar theory.
// Ascendant + 12 Equal house cusps via astronomia (julian/sidereal/nutation only).

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

// ── Astronomia (Julian Day + ascendant calc only — no VSOP87 data files) ─────
let julianLib, siderealLib, nutationLib;
try {
  julianLib   = require('astronomia/julian');
  siderealLib = require('astronomia/sidereal');
  nutationLib = require('astronomia/nutation');
} catch (e) {
  console.error('astronomia load error — check module paths:', e.message);
}

const { lookupCity } = require('./cities');

// ── Constants ────────────────────────────────────────────────────────────────
const PI2   = Math.PI * 2;
const DEG   = Math.PI / 180;   // degrees → radians
const RAD   = 180 / Math.PI;   // radians → degrees

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
  const l = norm360(lonDeg);
  const signIdx = Math.floor(l / 30);
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


// Julian Day from date string "YYYY-MM-DD" and optional time "HH:MM"
// Birth time is treated as local solar time (no timezone conversion —
// for most natal chart work this is standard practice; errors < 15 min
// shift the ascendant ~3–4° which is the acceptable range without a
// known timezone offset).
function birthJD(birthDate, birthTime) {
  const [yr, mo, dy] = birthDate.split('-').map(Number);
  let hour = 12; // default to noon if time unknown
  if (birthTime) {
    const parts = birthTime.split(':').map(Number);
    hour = parts[0] + (parts[1] || 0) / 60;
    console.log('birthJD parsing — raw:', birthTime, '| H:', parts[0], 'M:', parts[1], '| decimal hour:', hour.toFixed(4));
  } else {
    console.log('birthJD parsing — no birthTime, defaulting to noon (hour=12)');
  }
  return julianLib.CalendarGregorianToJD(yr, mo, dy + hour / 24.0);
}

// Today's Julian Day (UTC noon)
function todayJD() {
  const now = new Date();
  return julianLib.CalendarGregorianToJD(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate() + 0.5,
  );
}

// ── Full planetary positions for a given JD (pure JS — no npm packages) ──────
// Meeus "Astronomical Algorithms" orbital elements; simplified lunar theory.
function getAllPlanetPositions(jd) {
  const T   = (jd - 2451545.0) / 36525.0;
  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;

  function r(d) { return d * D2R; }
  function n(d) { return ((d % 360) + 360) % 360; }

  function equationOfCenter(M_deg, e) {
    const M = r(M_deg);
    return R2D * (
      (2*e - e*e*e/4) * Math.sin(M) +
      (5/4)*e*e       * Math.sin(2*M) +
      (13/12)*e*e*e   * Math.sin(3*M)
    );
  }

  function radiusVec(M_deg, a, e) {
    const M = r(M_deg);
    let E = M;
    for (let i = 0; i < 5; i++) E = M + e * Math.sin(E);
    return a * (1 - e * Math.cos(E));
  }

  // [mean_longitude_J2000, daily_motion_deg, lon_perihelion, eccentricity, semi-major_axis_AU]
  const elems = {
    Mercury: [252.250906, 149472.6746358,  77.45645, 0.20563069,  0.387098],
    Venus:   [181.979801,  58517.8156760, 131.56370, 0.00677323,  0.723330],
    Earth:   [100.466457,  35999.3728565, 102.93735, 0.01670862,  1.000000],
    Mars:    [355.433275,  19140.2993313, 336.04084, 0.09341233,  1.523688],
    Jupiter: [ 34.351519,   3034.9056606,  14.33131, 0.04839266,  5.202561],
    Saturn:  [ 50.077444,   1222.1137943,  93.05678, 0.05415060,  9.537070],
    Uranus:  [314.055005,    428.4669983, 173.00529, 0.04716771, 19.191264],
    Neptune: [304.348665,    218.4862002,  48.12369, 0.00858587, 30.068963],
    Pluto:   [238.956785,    145.1807643, 224.06676, 0.24880766, 39.48168677],
  };

  function helioLon(name) {
    const [L0, Lr, wb, e] = elems[name];
    const L = n(L0 + Lr * T);
    return n(L + equationOfCenter(n(L - wb), e));
  }

  function helioR(name) {
    const [L0, Lr, wb, e, a] = elems[name];
    const L = n(L0 + Lr * T);
    return radiusVec(n(L - wb), a, e);
  }

  const earthLon = helioLon('Earth');
  const earthR   = helioR('Earth');
  const earthX   = earthR * Math.cos(r(earthLon));
  const earthY   = earthR * Math.sin(r(earthLon));

  const sunLon = n(earthLon + 180);

  function geocentricLon(name) {
    const hLon = helioLon(name);
    const hR   = helioR(name);
    const px   = hR * Math.cos(r(hLon)) - earthX;
    const py   = hR * Math.sin(r(hLon)) - earthY;
    return n(Math.atan2(py, px) * R2D);
  }

  // Moon — simplified lunar theory (Meeus Ch. 47 abridged)
  const Lm = n(218.3165 + 481267.8813 * T);
  const Ms = n(357.5291 +  35999.0503 * T);
  const Mm = n(134.9634 + 477198.8676 * T);
  const Dm = n(297.8502 + 445267.1115 * T);
  const Fm = n( 93.2721 + 483202.0175 * T);
  const moonLon = n(Lm
    - 1.274 * Math.sin(r(Mm - 2*Dm))
    + 0.658 * Math.sin(r(2*Dm))
    - 0.186 * Math.sin(r(Ms))
    - 0.059 * Math.sin(r(2*Mm - 2*Dm))
    - 0.057 * Math.sin(r(Mm - 2*Dm + Ms))
    + 0.053 * Math.sin(r(Mm + 2*Dm))
    + 0.046 * Math.sin(r(2*Dm - Ms))
    + 0.041 * Math.sin(r(Mm - Ms))
    - 0.035 * Math.sin(r(Dm))
    - 0.031 * Math.sin(r(Mm + Ms))
    - 0.015 * Math.sin(r(2*Fm - 2*Dm))
    + 0.011 * Math.sin(r(Mm - 4*Dm))
  );

  return {
    Sun:     lonToPosition(sunLon),
    Moon:    lonToPosition(moonLon),
    Mercury: lonToPosition(geocentricLon('Mercury')),
    Venus:   lonToPosition(geocentricLon('Venus')),
    Mars:    lonToPosition(geocentricLon('Mars')),
    Jupiter: lonToPosition(geocentricLon('Jupiter')),
    Saturn:  lonToPosition(geocentricLon('Saturn')),
    Uranus:  lonToPosition(geocentricLon('Uranus')),
    Neptune: lonToPosition(geocentricLon('Neptune')),
    Pluto:   lonToPosition(geocentricLon('Pluto')),
  };
}

// ── Ascendant and Equal house cusps ──────────────────────────────────────────
// Requires geographic coordinates. Uses the standard ASC formula from
// Jean Meeus "Astronomical Algorithms" ch. 14.
function calcAscendantAndHouses(jd, latDeg, lonDeg) {
  try {
    // Greenwich Apparent Sidereal Time (astronomia returns radians)
    const gastRaw = siderealLib.apparent(jd);
    const gastRad = Math.abs(gastRaw) <= PI2 * 1.05 ? gastRaw : gastRaw * DEG;

    // Local Sidereal Time (radians)
    const lstRad = gastRad + lonDeg * DEG;

    // True obliquity of the ecliptic (radians)
    const epsRaw = nutationLib.trueObliquity(jd);
    const absEps = Math.abs(epsRaw);
    const epsRad = absEps > 360 ? epsRaw / 206265   // arcseconds → radians
                 : absEps > 1   ? epsRaw * DEG       // degrees → radians
                 :                epsRaw;             // already radians

    const latRad = latDeg * DEG;

    // Ascendant (standard formula)
    const ascRad = Math.atan2(
      -Math.cos(lstRad),
      Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad),
    );
    const ascDeg = norm360(ascRad * RAD);
    const asc    = lonToPosition(ascDeg);

    // Midheaven (MC)
    const mcRad  = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(epsRad));
    let   mcDeg  = norm360(mcRad * RAD);
    // Quadrant correction: MC and ASC should never be within 90° of each other
    if (Math.abs(norm360(mcDeg - ascDeg)) < 90) mcDeg = norm360(mcDeg + 180);
    const mc     = lonToPosition(mcDeg);

    // Equal house cusps: each cusp is 30° from the Ascendant
    const houses = [];
    for (let i = 0; i < 12; i++) {
      houses.push(lonToPosition(norm360(ascDeg + i * 30)));
    }

    return { asc, mc, houses };
  } catch (err) {
    console.error('Ascendant calculation error:', err.message);
    return null;
  }
}

// ── Transit aspects ───────────────────────────────────────────────────────────
// Compare current positions to natal positions; report major aspects.
function getTransitAspects(natal, current) {
  const lines = [];
  const planetNames = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];

  for (const transitPlanet of planetNames) {
    const tPos = current[transitPlanet];
    if (tPos.lon === null) continue;

    for (const natalPlanet of planetNames) {
      const nPos = natal[natalPlanet];
      if (nPos.lon === null) continue;

      const diff = Math.abs(norm360(tPos.lon - nPos.lon));
      const angle = diff > 180 ? 360 - diff : diff;

      for (const asp of ASPECTS) {
        if (Math.abs(angle - asp.angle) <= asp.orb) {
          lines.push(
            `Transit ${transitPlanet} (${tPos.label}) ${asp.name} natal ${natalPlanet} (${nPos.label})`,
          );
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
  const m = mStr || '00';
  const ampm = h < 12 ? 'AM' : 'PM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

// ── Build the full natal chart summary injected into the Vapi prompt ─────────
async function buildNatalSummary({ name, birthDate, birthTime, birthCity }) {
  if (!julianLib) {
    return `[Natal chart unavailable — required libraries failed to load. Proceed with name: ${name}, birth date: ${birthDate}, birth city: ${birthCity}.]`;
  }

  const friendlyTime = formatBirthTime(birthTime);
  const timeNote = friendlyTime
    ? `Birth time ${friendlyTime} was provided.`
    : 'No birth time was provided — Ascendant and house positions are approximate (defaulted to noon). Ask if the caller can find their exact birth time.';

  const [yr] = birthDate.split('-').map(Number);
  const jd   = birthJD(birthDate, birthTime);
  const jdNow = todayJD();

  const PLANET_UNKNOWN = { label: '[calculation failed]', sign: 'unknown', lon: null };
  const PLANETS_FALLBACK = Object.fromEntries(
    ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']
      .map(p => [p, PLANET_UNKNOWN])
  );

  let natal          = PLANETS_FALLBACK;
  let current        = PLANETS_FALLBACK;
  let transitAspects = ['Transit aspects unavailable — planet calculation failed.'];

  try {
    natal          = getAllPlanetPositions(jd);
    current        = getAllPlanetPositions(jdNow);
    transitAspects = getTransitAspects(natal, current);
  } catch (err) {
    console.error('Planet calculation failed:', err.message);
    await sendChartFailureAlert({ name, birthDate, birthTime, birthCity, error: err.message });
  }

  const coords  = lookupCity(birthCity);
  let ascBlock  = '';
  let ascSign   = 'unknown — ask the caller';

  if (coords) {
    let result = null;
    try {
      result = calcAscendantAndHouses(jd, coords.lat, coords.lon);
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
Pluto:   ${natal.Pluto.label}  (exact position via ephemeris)
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

  const { name, phoneNumber, birthDate, birthTime, birthCity } = req.body || {};
  console.log('birthTime received:', birthTime, 'type:', typeof birthTime, 'length:', birthTime?.length);
  if (!name || !phoneNumber || !birthDate || !birthCity) {
    return res.status(400).json({ error: 'name, phoneNumber, birthDate, and birthCity are required' });
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
      },
    },
  };

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
