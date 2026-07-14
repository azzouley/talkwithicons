// patch-escape-hatch-fix.js
// Adds escape hatch rule to 5 characters that failed in patch-escape-hatch.js:
//   einstein, brucelee, holmes, oswald — prose CRITICAL RULES, sep = \n\n\n\n---\n
//   sittingbull                         — numbered rules 1-8, sep = \n\n---\n
// Idempotency guard: checks for "reset the count — do not append again"
// Run: node --use-system-ca patch-escape-hatch-fix.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const BACKUP_DIR = path.join(__dirname, 'vapi-backup-2026-07-01-escape-hatch-fix');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const ASSISTANTS = [
  { name: 'einstein',    id: 'b98cec95-47a4-455d-92c8-3a08aacb556d' },
  { name: 'brucelee',   id: '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141' },
  { name: 'holmes',     id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6' },
  { name: 'oswald',     id: '2f0047c1-eeb7-412d-b455-f8f731bdd232' },
  { name: 'sittingbull',id: 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0' },
];

const RULE_TEXT = `When you ask {{callerName}} a follow-up question, count how many consecutive questions you have initiated in this conversation. On your 2nd initiated question, append this naturally to the end of your question: "...or is there something else you'd like to ask me?" On your 4th initiated question, append something that feels like genuine curiosity rather than a scripted offer: "...though I find myself wondering what else you came here to ask." The wording must feel like a natural extension of whatever question precedes it, not a separate sentence bolted on. After the 4th, reset the count — do not append again until the 2nd question in the next cycle.`;

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

// Find the separator that ends the CRITICAL RULES section.
// Returns { idx, sep } or null.
// Handles: \n\n---\n\n (standard), \n\n\n\n---\n (Einstein/Lee/Holmes/Oswald), \n\n---\n (SittingBull)
function findCritSeparator(prompt) {
  const critIdx = prompt.indexOf('CRITICAL RULES');
  if (critIdx === -1) return null;

  const afterCrit = prompt.slice(critIdx);
  // Match 2-5 newlines, then ---, then at least 1 newline
  const m = afterCrit.match(/\n{2,5}---\n+/);
  if (!m) return null;

  return { idx: critIdx + m.index, sep: m[0] };
}

// Count existing numbered rules in CRITICAL RULES section (before separator).
function countRules(prompt, sepIdx) {
  const critIdx = prompt.indexOf('CRITICAL RULES');
  if (critIdx === -1) return 0;
  const section = prompt.slice(critIdx, sepIdx);
  const matches = section.match(/^\d+\. /gm) || [];
  return matches.length;
}

(async () => {
  const results = [];

  for (const a of ASSISTANTS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`${a.name.toUpperCase()} (${a.id})`);

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

    if (prompt.includes('reset the count — do not append again')) {
      console.log(`  Already has escape hatch rule — skipping.`);
      results.push({ name: a.name, ok: true, skipped: true, chars: beforeLen });
      continue;
    }

    const found = findCritSeparator(prompt);
    if (!found) {
      console.error('  Cannot find separator after CRITICAL RULES');
      results.push({ name: a.name, ok: false, error: 'no separator after CRITICAL RULES' });
      continue;
    }

    const { idx: sepIdx, sep } = found;
    const ruleCount = countRules(prompt, sepIdx);

    // Numbered prompt: "N. rule text"; prose prompt: just the rule text (no number)
    const newRule = ruleCount > 0
      ? `\n\n${ruleCount + 1}. ${RULE_TEXT}`
      : `\n\n${RULE_TEXT}`;

    const newPrompt = prompt.slice(0, sepIdx) + newRule + prompt.slice(sepIdx);

    console.log(`  Sep: ${JSON.stringify(sep)} | Rules: ${ruleCount} | Numbered: ${ruleCount > 0} | Chars: ${beforeLen} → ${newPrompt.length} (+${newPrompt.length - beforeLen})`);

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

    const { status: vStatus, body: verified } = await vapiGet(a.id);
    if (vStatus !== 200) {
      console.error(`  Verify GET failed: ${vStatus}`);
      results.push({ name: a.name, ok: false, error: `verify GET ${vStatus}` });
      continue;
    }

    const vPrompt = getPrompt(verified);
    const verifyOk = vPrompt && vPrompt.includes('reset the count — do not append again');

    if (verifyOk) {
      console.log(`  VERIFY OK — escape hatch live.`);
    } else {
      console.error(`  VERIFY FAIL — rule text not found in returned prompt`);
    }

    results.push({
      name: a.name, ok: verifyOk,
      ruleCount, numbered: ruleCount > 0,
      beforeLen, afterLen: newPrompt.length,
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
      const label = r.numbered ? `Rule ${r.ruleCount + 1}` : 'prose';
      console.log(`${icon} ${r.name.padEnd(14)} ${label} added | ${r.beforeLen} → ${r.afterLen} (+${r.delta})`);
    } else {
      console.log(`${icon} ${r.name.padEnd(14)} FAILED — ${r.error || ''}`);
    }
  }

  const allOk = results.every(r => r.ok);
  console.log(`\nOverall: ${allOk ? 'SUCCESS' : 'SOME FAILURES'}`);
  process.exit(allOk ? 0 : 1);
})();
