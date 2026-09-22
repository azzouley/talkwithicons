// scripts/test-call.js
//
// Places a direct outbound Vapi call to a character, bypassing the site
// entirely: no Stripe payment-intent creation, no DB writes, no
// call-ended.js billing path. It resolves assistantId/phoneNumberId the
// same way api/start-call-basic.js (and, for Evangeline, api/start-call.js)
// do — same env var names, same per-character fallback to the shared
// default number.
//
// Usage:
//   node --use-system-ca scripts/test-call.js <character> [phoneNumber] [callerName]
//
// <character> one of: aela, vincent, oswald, davinci, watson, rocca,
//   celeste, nostradamus, evangeline, houdini, tesla, vance
//
// [phoneNumber] optional, e.g. +15551234567. If omitted, defaults to
//   process.env.ALERT_PHONE_NUMBER (Ruby's real phone — never hardcoded
//   here since it's a personal number, not something to commit to git).
//   Set it locally before running, or pass a number explicitly:
//     ALERT_PHONE_NUMBER=+1555... node --use-system-ca scripts/test-call.js aela
//
// Requires VAPI_API_KEY_LOCAL (or VAPI_API_KEY) in the environment.

const https = require('https');

const KEY = process.env.VAPI_API_KEY_LOCAL || process.env.VAPI_API_KEY;
if (!KEY) {
  console.error('ERROR: set VAPI_API_KEY_LOCAL (or VAPI_API_KEY) in the environment first.');
  process.exit(1);
}

// current-name -> internal routing key used by start-call-basic.js's env var
// names, taken directly from each live page's own `character:` field.
const ROUTING_KEY = {
  aela:        'aela',
  celeste:     'bennet',
  davinci:     'davinci',
  houdini:     'houdini',
  vance:       'sittingbull',
  nostradamus: 'nostradamus',
  oswald:      'baldwin',
  rocca:       'einstein',
  tesla:       'frankenstein',
  vincent:     'vincent',
  watson:      'holmes',
  // evangeline is handled separately below — she's not in start-call-basic.js's maps.
};

function envKey(prefix, routingKey) {
  return `${prefix}_${routingKey.toUpperCase()}`;
}

async function main() {
  const [, , characterArg, phoneArg, callerNameArg] = process.argv;
  const character = (characterArg || '').toLowerCase();

  if (!character) {
    console.error('Usage: node --use-system-ca scripts/test-call.js <character> [phoneNumber] [callerName]');
    console.error('Characters:', ['aela', 'vincent', 'oswald', 'davinci', 'watson', 'rocca', 'celeste', 'nostradamus', 'evangeline', 'houdini', 'tesla', 'vance'].join(', '));
    process.exit(1);
  }

  const phoneNumber = phoneArg || process.env.ALERT_PHONE_NUMBER;
  if (!phoneNumber) {
    console.error('ERROR: no phone number given and ALERT_PHONE_NUMBER is not set in the environment.');
    console.error('Either pass one: node --use-system-ca scripts/test-call.js ' + character + ' +15551234567');
    console.error('Or set it once:  ALERT_PHONE_NUMBER=+1555... node --use-system-ca scripts/test-call.js ' + character);
    process.exit(1);
  }

  const callerName = callerNameArg || 'Test Caller';

  let assistantId, phoneNumberId, assistantOverrides;

  if (character === 'evangeline') {
    assistantId    = process.env.VAPI_ASSISTANT_ID_EVANGELINE;
    phoneNumberId  = process.env.VAPI_PHONE_NUMBER_ID; // same shared default her own flow uses
    if (!assistantId) {
      console.error('ERROR: VAPI_ASSISTANT_ID_EVANGELINE is not set in the environment.');
      process.exit(1);
    }
    if (!phoneNumberId) {
      console.error('ERROR: VAPI_PHONE_NUMBER_ID is not set in the environment.');
      process.exit(1);
    }

    // Fixed test birth data — same shape her real site flow sends, just not
    // a real caller's actual birth details. New York resolves cleanly in
    // api/cities.js so the Ascendant/house-cusp calculation actually runs
    // instead of falling back to "city not found."
    const testBirth = { birthDate: '1990-06-15', birthTime: '14:30', birthCity: 'New York', birthCountry: 'USA' };
    const { buildNatalSummary } = require('../api/start-call.js');
    console.log('Building natal chart from fixed test birth data:', testBirth);
    const natalSummary = await buildNatalSummary({ name: callerName, ...testBirth });

    assistantOverrides = {
      variableValues: {
        callerName,
        natalChart:   natalSummary,
        birthDate:    testBirth.birthDate,
        birthTime:    testBirth.birthTime,
        birthCity:    testBirth.birthCity,
        birthCountry: testBirth.birthCountry,
        language:     'en',
      },
    };
  } else {
    const routingKey = ROUTING_KEY[character];
    if (!routingKey) {
      console.error(`ERROR: unknown character "${character}". Valid: ${['aela', 'vincent', 'oswald', 'davinci', 'watson', 'rocca', 'celeste', 'nostradamus', 'evangeline', 'houdini', 'tesla', 'vance'].join(', ')}`);
      process.exit(1);
    }

    assistantId   = process.env[envKey('VAPI_ASSISTANT_ID', routingKey)];
    phoneNumberId = process.env[envKey('VAPI_PHONE_NUMBER_ID', routingKey)] || process.env.VAPI_PHONE_NUMBER_ID;

    if (!assistantId) {
      console.error(`ERROR: ${envKey('VAPI_ASSISTANT_ID', routingKey)} is not set in the environment.`);
      process.exit(1);
    }
    if (!phoneNumberId) {
      console.error(`ERROR: neither ${envKey('VAPI_PHONE_NUMBER_ID', routingKey)} nor VAPI_PHONE_NUMBER_ID is set in the environment.`);
      process.exit(1);
    }

    assistantOverrides = {
      variableValues: { callerName, language: 'en' },
    };
  }

  const payload = {
    phoneNumberId,
    customer: { number: phoneNumber, name: callerName },
    assistantId,
    assistantOverrides,
    // deliberately no `metadata` — no paymentIntentId means call-ended.js's
    // Stripe billing branch never fires for this call.
  };

  console.log(`Placing test call: character=${character} assistantId=${assistantId} phoneNumberId=${phoneNumberId} to=${phoneNumber}`);

  const body = JSON.stringify(payload);
  const req = https.request({
    hostname: 'api.vapi.ai',
    path: '/call',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, res => {
    const chunks = [];
    res.on('data', c => chunks.push(c));
    res.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      let data;
      try { data = JSON.parse(raw); } catch (e) { data = raw; }
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        console.error('ERROR placing call:', res.statusCode, JSON.stringify(data).slice(0, 500));
        process.exit(1);
      }
      console.log('Call placed. id =', data.id, '| status =', data.status);
    });
  });
  req.on('error', err => { console.error('Request error:', err.message); process.exit(1); });
  req.write(body);
  req.end();
}

main();
