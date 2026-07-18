// patch-new-voices-silver-watson-friday.js
// Patch voice.voiceId only for Silver, Watson, and Friday, replacing the
// borrowed voices (Einstein's, Holmes's, Sitting Bull's) with their own new
// ElevenLabs Voice Design voices. Every other voice field (provider, model,
// stability, speed, etc.) is preserved exactly as-is.
// Per Rule 7: GET + backup before any PATCH.
// Run: VAPI_API_KEY_LOCAL=... node --use-system-ca patch-new-voices-silver-watson-friday.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const BACKUP_DIR = path.join(__dirname, 'vapi-backup');

const TARGETS = [
  { name: 'silver', id: 'b98cec95-47a4-455d-92c8-3a08aacb556d', newVoiceId: 'SSIn0rIMGHiQH7TrsfZd' },
  { name: 'watson', id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6', newVoiceId: 'nOUfIzE775HrCJ36dNjT' },
  { name: 'friday', id: 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0', newVoiceId: 'lcw5rkvXHtALye2alb6e' },
];

function vapiRequest(method, id, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = { hostname: 'api.vapi.ai', path: `/assistant/${id}`, method,
      headers: { Authorization: `Bearer ${KEY}` } };
    if (payload) {
      opts.headers['Content-Type']   = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { reject(new Error('JSON parse error: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function patchOne({ name, id, newVoiceId }) {
  const { status: getStatus, body: original } = await vapiRequest('GET', id);
  if (getStatus !== 200) return { name, ok: false, error: `GET returned ${getStatus}` };

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(path.join(BACKUP_DIR, `${name}-pre-newvoice.json`), JSON.stringify(original, null, 2));

  const oldVoice = original.voice || {};
  const oldVoiceId = oldVoice.voiceId;
  const newVoice = { ...oldVoice, voiceId: newVoiceId };

  const { status: patchStatus, body: patched } = await vapiRequest('PATCH', id, { voice: newVoice });
  if (patchStatus !== 200 && patchStatus !== 201) {
    return { name, ok: false, error: `PATCH returned ${patchStatus}: ${JSON.stringify(patched).slice(0,200)}` };
  }

  const { status: verifyStatus, body: verified } = await vapiRequest('GET', id);
  if (verifyStatus !== 200) return { name, ok: false, error: `verify GET returned ${verifyStatus}` };

  const verifiedVoice = verified.voice || {};
  const voiceIdUpdated = verifiedVoice.voiceId === newVoiceId;
  // Confirm every other voice field is untouched.
  const otherFieldsUnchanged = Object.keys(oldVoice).every(k => {
    if (k === 'voiceId') return true;
    return JSON.stringify(verifiedVoice[k]) === JSON.stringify(oldVoice[k]);
  });
  const noExtraFields = Object.keys(verifiedVoice).every(k => k in oldVoice || k === 'voiceId');
  const nameUnchanged = verified.name === original.name;
  const promptUnchanged = JSON.stringify(verified.model) === JSON.stringify(original.model);
  const phoneUnchanged = verified.phoneNumberId === original.phoneNumberId;
  const idUnchanged = verified.id === original.id;

  return {
    name, assistantName: verified.name,
    ok: voiceIdUpdated && otherFieldsUnchanged && noExtraFields && nameUnchanged && promptUnchanged && phoneUnchanged && idUnchanged,
    oldVoiceId, newVoiceId: verifiedVoice.voiceId,
    checks: { voiceIdUpdated, otherFieldsUnchanged, noExtraFields, nameUnchanged, promptUnchanged, phoneUnchanged, idUnchanged },
    oldVoiceObj: oldVoice, newVoiceObj: verifiedVoice,
  };
}

(async () => {
  const results = [];
  for (const t of TARGETS) {
    console.log(`\n=== ${t.name} ===`);
    const r = await patchOne(t);
    results.push(r);
    if (!r.ok && r.error) {
      console.log('FAILED:', r.error);
    } else {
      console.log('assistant name:', r.assistantName);
      console.log('old voiceId:', r.oldVoiceId);
      console.log('new voiceId:', r.newVoiceId);
      console.log('old voice object:', JSON.stringify(r.oldVoiceObj));
      console.log('new voice object:', JSON.stringify(r.newVoiceObj));
      console.log('checks:', JSON.stringify(r.checks));
      console.log(r.ok ? 'SUCCESS' : 'CHECK FAILURES');
    }
  }

  console.log('\n\n=== SUMMARY ===');
  for (const r of results) {
    if (r.ok) console.log(`${r.name} (${r.assistantName}): ${r.oldVoiceId} -> ${r.newVoiceId} SUCCESS`);
    else console.log(`${r.name}: FAILED — ${r.error || 'check failures, see above'}`);
  }

  process.exit(results.some(r => !r.ok) ? 1 : 0);
})();
