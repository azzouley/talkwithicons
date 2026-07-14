// apply-maxtokens.js
// Applies maxTokens = 150 to all 13 Vapi assistants as a stopgap for the
// Vapi streaming-abort bug (GPT-4o stream aborted after ~4.25s mid-generation).
// Rule 7: GETs and saves full backups before any PATCH.
// Run with: node --use-system-ca apply-maxtokens.js

const https  = require('https');
const fs     = require('fs');
const path   = require('path');

const KEY            = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('Error: VAPI_API_KEY_LOCAL env var is required. Run: set VAPI_API_KEY_LOCAL=<your-key>'); process.exit(1); }
const NEW_MAX_TOKENS = 250;
const BACKUP_DIR     = path.join('C:/talkwithicons/vapi-backup-2026-06-27-to250');

const ASSISTANTS = [
  { name: 'einstein',     id: 'b98cec95-47a4-455d-92c8-3a08aacb556d' },
  { name: 'nostradamus',  id: 'bca7797f-d4c5-4b67-b22c-7506a0b045b9' },
{ name: 'brucelee',     id: '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141' },
  { name: 'holmes',       id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6' },
  { name: 'aela',         id: '9647119e-7cf6-4d22-968d-25f3f455a834' },
  { name: 'celeste',      id: '0560582f-8258-4803-8f2b-78b364fa23ca' },
  { name: 'oswald',       id: '2f0047c1-eeb7-412d-b455-f8f731bdd232' },
  { name: 'evangeline',   id: '7fd88fa7-f013-4693-9b52-ab8937e4225d' },
  { name: 'llorona',      id: 'a30672aa-7bbb-4cff-91ed-7a2f01b5823a' },
  { name: 'houdini',      id: 'ca384c56-f276-4940-b20b-1ae939bef23b' },
  { name: 'davinci',      id: '23ef91d2-fc8f-4fee-9c2e-25e93b51c331' },
  { name: 'frankenstein', id: 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881' },
];

function vapiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.vapi.ai',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.setTimeout(20000, () => req.destroy());
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function run() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const results = [];

  for (const { name, id } of ASSISTANTS) {
    process.stdout.write(`\n[${name}] GET pre-patch... `);

    // ── 1. GET pre-patch state ────────────────────────────────────────────────
    const preRes = await vapiRequest('GET', `/assistant/${id}`);
    if (preRes.status !== 200) {
      console.log(`FAILED (HTTP ${preRes.status}): ${preRes.body.slice(0, 200)}`);
      results.push({ name, before: 'ERROR', after: '—', ok: false });
      continue;
    }
    const pre = JSON.parse(preRes.body);
    fs.writeFileSync(path.join(BACKUP_DIR, `${name}-pre-maxtokens.json`), JSON.stringify(pre, null, 2));

    const beforeTokens = pre.model?.maxTokens ?? 'NOT SET';
    console.log(`OK (maxTokens=${beforeTokens})`);

    // ── 2. PATCH — send full model object with maxTokens added ────────────────
    process.stdout.write(`[${name}] PATCH maxTokens=${NEW_MAX_TOKENS}... `);

    const patchModel = {
      ...pre.model,
      maxTokens: NEW_MAX_TOKENS,
    };

    const patchRes = await vapiRequest('PATCH', `/assistant/${id}`, { model: patchModel });
    if (patchRes.status !== 200 && patchRes.status !== 201) {
      console.log(`FAILED (HTTP ${patchRes.status}): ${patchRes.body.slice(0, 200)}`);
      results.push({ name, before: beforeTokens, after: 'PATCH FAILED', ok: false });
      continue;
    }
    console.log(`OK`);

    // ── 3. GET post-patch for verification ────────────────────────────────────
    process.stdout.write(`[${name}] GET post-patch verify... `);
    const postRes = await vapiRequest('GET', `/assistant/${id}`);
    const post = JSON.parse(postRes.body);
    fs.writeFileSync(path.join(BACKUP_DIR, `${name}-post-maxtokens.json`), JSON.stringify(post, null, 2));

    const afterTokens = post.model?.maxTokens ?? 'NOT SET';

    // Verify: maxTokens changed, system prompt and provider/model unchanged
    const promptMatch = pre.model?.messages?.[0]?.content === post.model?.messages?.[0]?.content;
    const providerMatch = pre.model?.provider === post.model?.provider;
    const modelMatch   = pre.model?.model    === post.model?.model;
    const tokensOk     = afterTokens === NEW_MAX_TOKENS;

    const allOk = tokensOk && promptMatch && providerMatch && modelMatch;

    if (allOk) {
      console.log(`OK — maxTokens ${beforeTokens} → ${afterTokens}, prompt/provider/model unchanged`);
    } else {
      console.log(`MISMATCH:`);
      if (!tokensOk)    console.log(`  maxTokens expected ${NEW_MAX_TOKENS}, got ${afterTokens}`);
      if (!promptMatch) console.log(`  SYSTEM PROMPT CHANGED — investigate immediately`);
      if (!providerMatch) console.log(`  provider changed: ${pre.model?.provider} → ${post.model?.provider}`);
      if (!modelMatch)    console.log(`  model changed: ${pre.model?.model} → ${post.model?.model}`);
    }

    results.push({ name, before: String(beforeTokens), after: String(afterTokens), ok: allOk });
  }

  // ── Summary table ─────────────────────────────────────────────────────────
  console.log('\n\n=== RESULTS ===');
  console.log('Character'.padEnd(16) + 'Before'.padEnd(12) + 'After'.padEnd(12) + 'Other fields');
  console.log('─'.repeat(60));
  for (const r of results) {
    const status = r.ok ? 'unchanged ✓' : 'CHECK ⚠';
    console.log(r.name.padEnd(16) + r.before.padEnd(12) + r.after.padEnd(12) + status);
  }

  const allPassed = results.every(r => r.ok);
  console.log(`\n${allPassed ? 'ALL 13 PASSED.' : 'ERRORS — check above before proceeding.'}`);
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
