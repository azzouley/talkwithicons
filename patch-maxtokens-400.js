// patch-maxtokens-400.js
// Raise maxTokens from 250 to 400 for all 12 active characters.
// Reasoning: longest clean single beat observed in call logs = 244 tokens.
// Two Bruce Lee truncations hit exactly 250 cap at 233-235 tokens per turn.
// 400 provides ~64% headroom above confirmed clean-beat ceiling.
// Per Rule 7: GET + backup before any PATCH.
// Run: node --use-system-ca patch-maxtokens-400.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const NEW_MAX_TOKENS = 400;

const BACKUP_DIR = path.join(__dirname, 'vapi-backup-2026-06-29-maxtokens-400');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const ASSISTANTS = [
  { name: 'einstein',     id: 'b98cec95-47a4-455d-92c8-3a08aacb556d' },
  { name: 'nostradamus',  id: 'bca7797f-d4c5-4b67-b22c-7506a0b045b9' },
  { name: 'davinci',      id: '23ef91d2-fc8f-4fee-9c2e-25e93b51c331' },
  { name: 'brucelee',     id: '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141' },
  { name: 'holmes',       id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6' },
  { name: 'aela',         id: '9647119e-7cf6-4d22-968d-25f3f455a834' },
  { name: 'bennet',       id: '0560582f-8258-4803-8f2b-78b364fa23ca' },
  { name: 'baldwin',      id: '2f0047c1-eeb7-412d-b455-f8f731bdd232' },
  { name: 'evangeline',   id: '7fd88fa7-f013-4693-9b52-ab8937e4225d' },
  { name: 'houdini',      id: 'ca384c56-f276-4940-b20b-1ae939bef23b' },
  { name: 'frankenstein', id: 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881' },
  { name: 'sittingbull',  id: 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0' },
];

function vapiGet(id) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.vapi.ai',
      path:     `/assistant/${id}`,
      method:   'GET',
      headers:  { Authorization: `Bearer ${KEY}` },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { reject(new Error('JSON parse: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function vapiPatch(id, body) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.vapi.ai',
      path:     `/assistant/${id}`,
      method:   'PATCH',
      headers:  {
        Authorization:    `Bearer ${KEY}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { reject(new Error('JSON parse: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  const results = [];

  for (const a of ASSISTANTS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${a.name.toUpperCase()} (${a.id})`);

    // GET + backup
    console.log('  GET...');
    const { status: getStatus, body: original } = await vapiGet(a.id);
    if (getStatus !== 200) {
      console.error(`  ERROR: GET ${getStatus}`);
      results.push({ name: a.name, ok: false, error: `GET ${getStatus}` });
      continue;
    }

    const backupFile = path.join(BACKUP_DIR, `${a.name}-${a.id}-backup.json`);
    fs.writeFileSync(backupFile, JSON.stringify(original, null, 2));

    const currentMaxTok = original?.model?.maxTokens;
    const origModel    = original?.model?.model;
    const origProvider = original?.model?.provider;
    console.log(`  current maxTokens: ${currentMaxTok} → ${NEW_MAX_TOKENS}`);

    // PATCH — spread full model config, override only maxTokens
    const patchBody = { model: { ...original.model, maxTokens: NEW_MAX_TOKENS } };
    console.log('  PATCH...');
    const { status: patchStatus, body: patched } = await vapiPatch(a.id, patchBody);
    if (patchStatus !== 200 && patchStatus !== 201) {
      console.error(`  ERROR: PATCH ${patchStatus}`, JSON.stringify(patched).slice(0, 200));
      results.push({ name: a.name, ok: false, error: `PATCH ${patchStatus}` });
      continue;
    }

    // Verify
    console.log('  GET (verify)...');
    const { status: vStatus, body: verified } = await vapiGet(a.id);
    if (vStatus !== 200) {
      console.error(`  ERROR: verify GET ${vStatus}`);
      results.push({ name: a.name, ok: false, error: `verify GET ${vStatus}` });
      continue;
    }

    const vMaxTok   = verified?.model?.maxTokens;
    const vModel    = verified?.model?.model;
    const vProvider = verified?.model?.provider;

    const maxTokOk = vMaxTok   === NEW_MAX_TOKENS;
    const modelOk  = vModel    === origModel;
    const provOk   = vProvider === origProvider;

    if (maxTokOk && modelOk && provOk) {
      console.log(`  OK: maxTokens=${vMaxTok}, model=${vModel}/${vProvider}`);
    } else {
      console.warn(`  WARN: maxTokens=${vMaxTok}(${maxTokOk}) model=${vModel}(${modelOk}) provider=${vProvider}(${provOk})`);
    }

    results.push({ name: a.name, ok: maxTokOk && modelOk && provOk, prevMaxTok: currentMaxTok, newMaxTok: vMaxTok });
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon} ${r.name.padEnd(14)} ${r.prevMaxTok} → ${r.newMaxTok}  ${r.ok ? '' : 'FAILED'}`);
  }

  const allOk = results.every(r => r.ok);
  console.log(`\nOverall: ${allOk ? 'SUCCESS' : 'SOME FAILURES'}`);
  process.exit(allOk ? 0 : 1);
})();
