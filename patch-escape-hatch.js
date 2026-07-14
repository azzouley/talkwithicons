// patch-escape-hatch.js
// Adds Rule 9 (escape hatch / exit offer pattern) to all 12 active character prompts.
// Inserts BEFORE the first --- separator, which always ends the CRITICAL RULES section.
// Per Rule 7: GET + backup before any PATCH. Additive only.
// Run: node --use-system-ca patch-escape-hatch.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const BACKUP_DIR = path.join(__dirname, 'vapi-backup-2026-07-01-escape-hatch');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const ASSISTANTS = [
  { name: 'einstein',     id: 'b98cec95-47a4-455d-92c8-3a08aacb556d' },
  { name: 'nostradamus',  id: 'bca7797f-d4c5-4b67-b22c-7506a0b045b9' },
  { name: 'davinci',      id: '23ef91d2-fc8f-4fee-9c2e-25e93b51c331' },
  { name: 'brucelee',     id: '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141' },
  { name: 'holmes',       id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6' },
  { name: 'aela',         id: '9647119e-7cf6-4d22-968d-25f3f455a834' },
  { name: 'celeste',      id: '0560582f-8258-4803-8f2b-78b364fa23ca' },
  { name: 'baldwin',      id: '2f0047c1-eeb7-412d-b455-f8f731bdd232' },
  { name: 'evangeline',   id: '7fd88fa7-f013-4693-9b52-ab8937e4225d' },
  { name: 'houdini',      id: 'ca384c56-f276-4940-b20b-1ae939bef23b' },
  { name: 'frankenstein', id: 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881' },
  { name: 'sittingbull',  id: 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0' },
];

// The new rule — inserted as the final rule in the CRITICAL RULES section.
// Number is determined per-character at runtime based on how many rules already exist.
const RULE_TEXT = `When you ask {{callerName}} a follow-up question, count how many consecutive questions you have initiated in this conversation. On your 2nd initiated question, append this naturally to the end of your question: "...or is there something else you'd like to ask me?" On your 4th initiated question, append something that feels like genuine curiosity rather than a scripted offer: "...though I find myself wondering what else you came here to ask." The wording must feel like a natural extension of whatever question precedes it, not a separate sentence bolted on. After the 4th, reset the count — do not append again until the 2nd question in the next cycle.`;

// Separator that ends the CRITICAL RULES section in every prompt
const SECTION_SEP = '\n\n---\n\n';

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

function getPrompt(data) {
  const msgs = data?.model?.messages;
  if (!Array.isArray(msgs)) return null;
  const sys = msgs.find(m => m.role === 'system');
  return sys?.content || null;
}

// Count how many top-level CRITICAL RULES already exist (to pick the right rule number)
function nextRuleNumber(prompt) {
  // Rules are numbered lines like "1. ", "2. ", etc. in the CRITICAL RULES section.
  // The section ends at the first ---. Count lines matching /^\d+\. / before that.
  const critIdx = prompt.indexOf('CRITICAL RULES');
  if (critIdx === -1) return null;
  const sepIdx = prompt.indexOf(SECTION_SEP, critIdx);
  const section = sepIdx !== -1 ? prompt.slice(critIdx, sepIdx) : prompt.slice(critIdx);
  const matches = section.match(/^\d+\./gm) || [];
  return matches.length + 1;
}

(async () => {
  const results = [];

  for (const a of ASSISTANTS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`${a.name.toUpperCase()} (${a.id})`);

    // GET + backup
    const { status: getStatus, body: original } = await vapiGet(a.id);
    if (getStatus !== 200) {
      console.error(`  GET failed: ${getStatus}`);
      results.push({ name: a.name, ok: false, error: `GET ${getStatus}` });
      continue;
    }

    const backupFile = path.join(BACKUP_DIR, `${a.name}-${a.id}-backup.json`);
    fs.writeFileSync(backupFile, JSON.stringify(original, null, 2));

    let prompt = getPrompt(original);
    if (!prompt) {
      console.error('  No system prompt found');
      results.push({ name: a.name, ok: false, error: 'no system prompt' });
      continue;
    }

    const beforeLen = prompt.length;

    // Guard: already patched?
    if (prompt.includes('reset the count — do not append again')) {
      console.log(`  Already has escape hatch rule — skipping.`);
      results.push({ name: a.name, ok: true, skipped: true, chars: beforeLen });
      continue;
    }

    // Find insertion point: just before the first --- separator after CRITICAL RULES
    const sepIdx = prompt.indexOf(SECTION_SEP);
    if (sepIdx === -1) {
      console.error('  Cannot find --- section separator');
      results.push({ name: a.name, ok: false, error: 'no --- separator' });
      continue;
    }

    // Determine rule number
    const ruleNum = nextRuleNumber(prompt);
    if (!ruleNum) {
      console.error('  Cannot determine next rule number');
      results.push({ name: a.name, ok: false, error: 'no CRITICAL RULES section' });
      continue;
    }

    const newRule = `\n\n${ruleNum}. ${RULE_TEXT}`;
    const newPrompt = prompt.slice(0, sepIdx) + newRule + prompt.slice(sepIdx);

    console.log(`  Rule number: ${ruleNum} | Chars: ${beforeLen} → ${newPrompt.length} (+${newPrompt.length - beforeLen})`);

    // Build PATCH body preserving all other model fields
    const messages = (original.model.messages || []).map(m =>
      m.role === 'system' ? { ...m, content: newPrompt } : m
    );
    const patchBody = { model: { ...original.model, messages } };

    const { status: patchStatus, body: patched } = await vapiPatch(a.id, patchBody);
    if (patchStatus !== 200 && patchStatus !== 201) {
      console.error(`  PATCH failed: ${patchStatus}`, JSON.stringify(patched).slice(0, 200));
      results.push({ name: a.name, ok: false, error: `PATCH ${patchStatus}` });
      continue;
    }

    // Verify
    const { status: vStatus, body: verified } = await vapiGet(a.id);
    if (vStatus !== 200) {
      console.error(`  Verify GET failed: ${vStatus}`);
      results.push({ name: a.name, ok: false, error: `verify GET ${vStatus}` });
      continue;
    }

    const vPrompt = getPrompt(verified);
    const verifyOk = vPrompt && vPrompt.includes('reset the count — do not append again');

    if (verifyOk) {
      console.log(`  VERIFY OK — rule ${ruleNum} live.`);
    } else {
      console.error(`  VERIFY FAIL — rule text not found in returned prompt`);
    }

    results.push({
      name: a.name, ok: verifyOk,
      ruleNum, beforeLen, afterLen: newPrompt.length,
      delta: newPrompt.length - beforeLen,
    });
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('SUMMARY');
  console.log('═'.repeat(60));
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    if (r.skipped) {
      console.log(`${icon} ${r.name.padEnd(14)} already patched`);
    } else if (r.ok) {
      console.log(`${icon} ${r.name.padEnd(14)} Rule ${r.ruleNum} added | ${r.beforeLen} → ${r.afterLen} (+${r.delta})`);
    } else {
      console.log(`${icon} ${r.name.padEnd(14)} FAILED — ${r.error || ''}`);
    }
  }

  const allOk = results.every(r => r.ok);
  console.log(`\nOverall: ${allOk ? 'SUCCESS' : 'SOME FAILURES'}`);
  process.exit(allOk ? 0 : 1);
})();
