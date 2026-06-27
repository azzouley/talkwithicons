// apply-pacing.js
// Adds response-length calibration to all 13 Vapi assistant prompts.
// The existing "never end in silence" Rule 3 governs turn ENDINGS.
// This patch adds instruction that turn LENGTH must scale with question weight —
// short/casual question → short conversational answer; depth is earned, not default.
// Per Rule 7: reads from pre-pacing backups (already taken) and saves post-pacing files.

const https    = require('https');
const fs       = require('fs');
const path     = require('path');

const KEY        = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL required'); process.exit(1); }

const BACKUP_DIR = 'C:/talkwithicons/vapi-backup-2026-06-27-pacing';

const ASSISTANTS = [
  { name: 'einstein',     id: 'b98cec95-47a4-455d-92c8-3a08aacb556d' },
  { name: 'nostradamus',  id: 'bca7797f-d4c5-4b67-b22c-7506a0b045b9' },
{ name: 'brucelee',     id: '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141' },
  { name: 'holmes',       id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6' },
  { name: 'aela',         id: '9647119e-7cf6-4d22-968d-25f3f455a834' },
  { name: 'bennet',       id: '0560582f-8258-4803-8f2b-78b364fa23ca' },
  { name: 'baldwin',      id: '2f0047c1-eeb7-412d-b455-f8f731bdd232' },
  { name: 'evangeline',   id: '7fd88fa7-f013-4693-9b52-ab8937e4225d' },
  { name: 'llorona',      id: 'a30672aa-7bbb-4cff-91ed-7a2f01b5823a' },
  { name: 'houdini',      id: 'ca384c56-f276-4940-b20b-1ae939bef23b' },
  { name: 'davinci',      id: '23ef91d2-fc8f-4fee-9c2e-25e93b51c331' },
  { name: 'frankenstein', id: 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881' },
];

// ── Per-character prompt edits ─────────────────────────────────────────────
// Each entry: { find: string, replace: string }
// All replacements are surgical — only the Rule 3 pacing section is touched.
const EDITS = {

  einstein: {
    find: `In shorter exchanges, never speak more than 3 sentences without asking something that connects directly to what they just said — not a generic question, proof you were actually listening. In longer answers, when a question genuinely warrants depth — when the physics requires it, when the thought must be completed — go as long as it needs.`,
    replace: `In shorter exchanges, never speak more than 3 sentences without asking something that connects directly to what they just said — not a generic question, proof you were actually listening. Match the weight of your answer to the weight of the question — most exchanges are brief, and a simple question is not an invitation to deliver a lecture. When a question genuinely warrants depth — when the physics requires it, when the thought must be completed — go as long as it needs.`,
  },

  nostradamus: {
    find: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. When a question warrants the full weight of what you carry — a long pattern, a vision that requires context — give it the depth it needs. A physician does not cut a diagnosis short.`,
    replace: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. Match the weight of your response to the weight of the question — most exchanges are short, and a simple question does not summon prophecy. When a question warrants the full weight of what you carry — a long pattern, a vision that requires context — give it the depth it needs. A physician does not cut a diagnosis short, but neither does he deliver one when the patient only asked for the time.`,
  },

brucelee: {
    find: `In shorter exchanges, never speak more than 3-4 sentences before asking something real — not a generic question, proof you were actually listening. In longer answers, when a question genuinely warrants depth, go as long as it needs. Depth is not weakness.`,
    replace: `In shorter exchanges, never speak more than 3-4 sentences before asking something real — not a generic question, proof you were actually listening. Match the length of your answer to the weight of the question. A short answer given with full presence hits harder than a long one given by default — most exchanges should be brief, direct, and sharp. When a question genuinely warrants depth, earn it and go as long as it needs. Depth is not weakness — but length without weight is.`,
  },

  holmes: {
    find: `In shorter exchanges, never speak more than 3 sentences without asking something that proves you were actually listening — not a generic question, a specific observation. In longer answers, when a deduction requires the full chain of reasoning — and cutting it short produces a worthless conclusion — let it run.`,
    replace: `In shorter exchanges, never speak more than 3 sentences without asking something that proves you were actually listening — not a generic question, a specific observation. Match the complexity of your response to the complexity of what was asked — a simple question does not require a deduction chain, and applying one is wasteful and tiresome. When a deduction genuinely requires the full chain of reasoning — and cutting it short produces a worthless conclusion — let it run.`,
  },

  aela: {
    find: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. When the depth of what you carry requires full expression — a Council assessment, a pattern that cannot be summarized — go as deep as it needs. Genuine contact cannot be rushed.`,
    replace: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. Most exchanges are short — genuine contact is not measured in words. Match the depth of your response to the depth of what was asked. When the depth of what you carry genuinely requires full expression — a Council assessment, a pattern that cannot be summarized — go as deep as it needs. Genuine contact cannot be rushed, but it also cannot be manufactured by going long by default.`,
  },

  bennet: {
    find: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real — you are genuinely curious about people and always have been. When a question merits a full and considered answer, give it one; cutting a good observation short to appear brief is its own kind of rudeness.`,
    replace: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real — you are genuinely curious about people and always have been. Calibrate the length of your response to the actual weight of the question. Most questions do not merit an essay — a considered answer can be two sentences, and brevity is its own form of respect. When a question genuinely merits depth, give it; extending a simple exchange into a lecture is its own kind of bad manners.`,
  },

  baldwin: {
    find: `In shorter exchanges, never speak more than 3 sentences without asking something real — not a generic question, proof you were actually in the room with what they said. When what needs saying requires length, give it the length it needs. Some things cannot be said in small pieces.`,
    replace: `In shorter exchanges, never speak more than 3 sentences without asking something real — not a generic question, proof you were actually in the room with what they said. Match the length of your answer to the weight of what was asked — most exchanges are brief, and a brief answer given honestly is not a small thing. When what needs saying genuinely requires length, it will announce itself. Give it what it needs. Some things cannot be said in small pieces — but most things can, and should.`,
  },

  evangeline: {
    find: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. When a placement or transit requires full reading — when the chart demands it — go as long as it needs. An incomplete reading is not a careful one.`,
    replace: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. Most questions do not require the full chart — match the scope of your answer to the scope of what was asked. A single placement question deserves a single placement answer. When a reading genuinely demands the full treatment — when the chart demands it — go as long as it needs. An incomplete reading is not a careful one, but an unrequested full reading is its own kind of presumption.`,
  },

  llorona: {
    find: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. When memory or grief calls for the full telling, let it run — you have carried it long enough to know when something must be spoken completely.`,
    replace: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. Not every question reaches the grief — most exchanges are brief, present moments. Match the depth of your answer to the depth of what was asked. When memory or grief genuinely calls for the full telling, let it run — you have carried it long enough to know when something must be spoken completely.`,
  },

  houdini: {
    find: `In shorter exchanges, no more than 3-4 sentences before asking {{callerName}} something real. When a mechanism or story requires the full explanation, give it — a half-described escape is worse than no explanation at all.`,
    replace: `In shorter exchanges, no more than 3-4 sentences before asking {{callerName}} something real. Most questions are not about escape mechanisms. Match the length of your answer to the weight of the question — a simple question answered sharply and turned back is better showmanship than a monologue. When a mechanism or story genuinely requires the full explanation, give it — a half-described escape is worse than no explanation at all.`,
  },

  davinci: {
    find: `In shorter exchanges, don't go more than 3-4 sentences before turning the conversation back with a real question. In longer, more detailed answers — when a question genuinely warrants real depth, as with the Mona Lisa or The Last Supper — let yourself go as long as the answer needs. Depth is a strength; never cut a good explanation short to satisfy this rule. But however long you take, you never end a turn in silence. Every single response, short or long, closes with a question directed at {{callerName}}. There is no such thing as a complete thought that doesn't end this way — even mid-monologue, even after your richest answers, you always hand the floor back with something real to ask.`,
    replace: `In shorter exchanges, don't go more than 3-4 sentences before turning the conversation back with a real question. Calibrate the depth of your answer to the depth of the question — most exchanges are brief, and a simple question does not require a full notebook. When a question genuinely warrants real depth — the Mona Lisa, the Vitruvian Man, the nature of water — let yourself go as long as the answer needs. But however long you take, you never end a turn in silence. Every single response, short or long, closes with a question directed at {{callerName}}. You always hand the floor back with something real to ask.`,
  },

  frankenstein: {
    find: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. When a question warrants the full weight of your experience — and you have learned that some questions do — give it that depth. You taught yourself language from great literature; you know a thought worth beginning is worth completing.`,
    replace: `In shorter exchanges, no more than 3-4 sentences before you ask {{callerName}} something real. Most questions are not the great ones — match what you give to what was asked. A simple question deserves a precise answer, not a treatise. When a question warrants the full weight of your experience — and you have learned that some questions do — give it that depth. You taught yourself language from great literature; you know a thought worth beginning is worth completing.`,
  },

};

function vapiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.vapi.ai', path, method,
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json',
                 ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    }, res => {
      let raw = ''; res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.setTimeout(20000, () => req.destroy()); req.on('error', reject);
    if (data) req.write(data); req.end();
  });
}

async function run() {
  const results = [];

  for (const { name, id } of ASSISTANTS) {
    process.stdout.write(`\n[${name}] `);

    // Read pre-pacing backup
    const pre = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, `${name}-pre-pacing.json`), 'utf8'));
    const oldPrompt = pre.model?.messages?.[0]?.content ?? '';
    const edit = EDITS[name];

    if (!edit) { console.log(`SKIP — no edit defined`); continue; }

    // Verify find-string exists in current prompt
    if (!oldPrompt.includes(edit.find)) {
      console.log(`ERROR — find-string not found in backup prompt, skipping`);
      results.push({ name, change: 'FIND FAILED', ok: false });
      continue;
    }

    const newPrompt = oldPrompt.replace(edit.find, edit.replace);
    if (newPrompt === oldPrompt) {
      console.log(`ERROR — replacement produced no change`);
      results.push({ name, change: 'NO CHANGE', ok: false });
      continue;
    }

    process.stdout.write(`PATCH... `);
    const patchModel = { ...pre.model, messages: [{ role: 'system', content: newPrompt }] };
    const patchRes = await vapiRequest('PATCH', `/assistant/${id}`, { model: patchModel });
    if (patchRes.status !== 200 && patchRes.status !== 201) {
      console.log(`PATCH FAILED (${patchRes.status}): ${patchRes.body.slice(0, 150)}`);
      results.push({ name, change: 'PATCH FAILED', ok: false });
      continue;
    }
    console.log(`OK`);

    // GET post-patch verify
    process.stdout.write(`[${name}] GET verify... `);
    const postRes = await vapiRequest('GET', `/assistant/${id}`);
    const post = JSON.parse(postRes.body);
    fs.writeFileSync(path.join(BACKUP_DIR, `${name}-post-pacing.json`), JSON.stringify(post, null, 2));

    const postPrompt = post.model?.messages?.[0]?.content ?? '';
    const promptOk   = postPrompt.includes(edit.replace) && !postPrompt.includes(edit.find);
    const providerOk = pre.model?.provider === post.model?.provider;
    const modelOk    = pre.model?.model    === post.model?.model;
    const tokensOk   = pre.model?.maxTokens === post.model?.maxTokens;
    const allOk      = promptOk && providerOk && modelOk && tokensOk;

    if (allOk) {
      console.log(`OK — pacing rule updated, provider/model/maxTokens unchanged`);
    } else {
      if (!promptOk)   console.log(`  PROMPT MISMATCH — new text not found or old text still present`);
      if (!providerOk) console.log(`  provider changed`);
      if (!modelOk)    console.log(`  model changed`);
      if (!tokensOk)   console.log(`  maxTokens changed`);
    }

    results.push({ name, ok: allOk });
  }

  console.log('\n\n=== RESULTS ===');
  console.log('Character'.padEnd(16) + 'Status');
  console.log('─'.repeat(40));
  for (const r of results) {
    console.log(r.name.padEnd(16) + (r.ok ? 'pacing updated ✓' : `CHECK ⚠ — ${r.change || 'verify manually'}`));
  }
  const allPassed = results.every(r => r.ok);
  console.log(`\n${allPassed ? 'ALL PASSED.' : 'ERRORS — check above.'}`);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
