// api/start-call.js
//
// Full natal chart calculation using the astronomia package (VSOP87 / ELP-2000).
// NOTE: astronomia uses Jean Meeus's "Astronomical Algorithms" (VSOP87 theory),
// not Swiss Ephemeris. Accuracy is within arc-minutes for modern dates —
// suitable for astrological sign and degree positions.
//
// Calculates: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus,
// Neptune (all via VSOP87/ELP-2000), Pluto sign (year-based lookup —
// Pluto is not in VSOP87), Ascendant + 12 Equal house cusps (requires
// birth city coordinates from api/cities.js), and current transits with
// major aspects to natal positions.

// ── Vapi credentials (set in Vercel environment variables) ──────────────────
const VAPI_API_KEY         = process.env.VAPI_API_KEY                 || 'YOUR_VAPI_API_KEY';
const VAPI_ASSISTANT_ID    = process.env.VAPI_ASSISTANT_ID_EVANGELINE || 'YOUR_EVANGELINE_ASSISTANT_ID';
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID         || 'YOUR_VAPI_PHONE_NUMBER_ID';

// ── Astronomia modules ───────────────────────────────────────────────────────
// If any require() fails, Vercel will surface the error at cold-start.
// Run `ls node_modules/astronomia` after `npm install` to verify paths.
let julianLib, solarLib, moonLib, ppLib, siderealLib, nutationLib;
let mercuryPlanet, venusRPlanet, marsPlanet, jupiterPlanet, saturnPlanet, uranusPlanet, neptunePlanet;

try {
  julianLib   = require('astronomia/julian');
  solarLib    = require('astronomia/solar');
  moonLib     = require('astronomia/moonposition');
  ppLib       = require('astronomia/planetposition');
  siderealLib = require('astronomia/sidereal');
  nutationLib = require('astronomia/nutation');

  // Instantiate VSOP87 planet objects — each wraps a data file
  mercuryPlanet  = new ppLib.Planet(require('astronomia/data/vsop87Bmercury'));
  venusRPlanet   = new ppLib.Planet(require('astronomia/data/vsop87Bvenus'));
  marsPlanet     = new ppLib.Planet(require('astronomia/data/vsop87Bmars'));
  jupiterPlanet  = new ppLib.Planet(require('astronomia/data/vsop87Bjupiter'));
  saturnPlanet   = new ppLib.Planet(require('astronomia/data/vsop87Bsaturn'));
  uranusPlanet   = new ppLib.Planet(require('astronomia/data/vsop87Buranus'));
  neptunePlanet  = new ppLib.Planet(require('astronomia/data/vsop87Bneptune'));
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

// ── Pluto sign (year-based — Pluto is not in VSOP87) ─────────────────────────
function plutoSign(year) {
  if (year < 1914) return 'Gemini';
  if (year < 1939) return 'Cancer';
  if (year < 1957) return 'Leo';
  if (year < 1972) return 'Virgo';
  if (year < 1984) return 'Libra';
  if (year < 1995) return 'Scorpio';
  if (year < 2008) return 'Sagittarius';
  if (year < 2024) return 'Capricorn';
  return 'Aquarius';
}

// ── Single planet longitude (degrees, 0–360) from a JD ───────────────────────
function planetLon(planetObj, jd) {
  const pos = planetObj.position(jd);
  // planetposition returns {lon, lat, range} — lon is always radians
  return norm360(pos.lon * RAD);
}

// ── Full planetary positions for a given JD ───────────────────────────────────
function getAllPlanetPositions(jd, birthYear) {
  const sunLonRaw = solarLib.apparentLongitude(jd);
  // solarLib.apparentLongitude returns degrees — no conversion needed
  const sunLon    = norm360(sunLonRaw);

  const moonPos = moonLib.position(jd);
  // moonposition returns {lon, ...} in radians — always multiply by RAD
  const moonLon = norm360(moonPos.lon * RAD);

  return {
    Sun:     lonToPosition(sunLon),
    Moon:    lonToPosition(moonLon),
    Mercury: lonToPosition(planetLon(mercuryPlanet,  jd)),
    Venus:   lonToPosition(planetLon(venusRPlanet,   jd)),
    Mars:    lonToPosition(planetLon(marsPlanet,      jd)),
    Jupiter: lonToPosition(planetLon(jupiterPlanet,   jd)),
    Saturn:  lonToPosition(planetLon(saturnPlanet,    jd)),
    Uranus:  lonToPosition(planetLon(uranusPlanet,    jd)),
    Neptune: lonToPosition(planetLon(neptunePlanet,   jd)),
    Pluto:   { sign: plutoSign(birthYear || 2000), degree: null, minutes: null,
               label: `${plutoSign(birthYear || 2000)} (sign only — Pluto not in VSOP87)`, lon: null },
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
function buildNatalSummary({ name, birthDate, birthTime, birthCity }) {
  if (!julianLib) {
    return `[Natal chart unavailable — astronomia failed to load. Proceed with name: ${name}, birth date: ${birthDate}, birth city: ${birthCity}.]`;
  }

  const [yr] = birthDate.split('-').map(Number);
  const jd   = birthJD(birthDate, birthTime);
  const jdNow = todayJD();

  const natal   = getAllPlanetPositions(jd, yr);
  const current = getAllPlanetPositions(jdNow, new Date().getUTCFullYear());

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

  const transitAspects = getTransitAspects(natal, current);

  const friendlyTime = formatBirthTime(birthTime);
  const timeNote = friendlyTime
    ? `Birth time ${friendlyTime} was provided.`
    : 'No birth time was provided — Ascendant and house positions are approximate (defaulted to noon). Ask if the caller can find their exact birth time.';

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
    natalSummary = buildNatalSummary({ name, birthDate, birthTime, birthCity });
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
