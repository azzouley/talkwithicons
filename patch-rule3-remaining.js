// Patch Rule 3 for Houdini, Frankenstein, Sitting Bull — add 120-word ceiling
const https = require('https');

const API_KEY = process.env.VAPI_API_KEY_LOCAL;
if (!API_KEY) { console.error('Set VAPI_API_KEY_LOCAL'); process.exit(1); }

const PATCHES = [
  {
    name: 'Houdini',
    id: 'ca384c56-f276-4940-b20b-1ae939bef23b',
    oldText: 'When a mechanism or story genuinely requires the full explanation, give it — a half-described escape is worse than no explanation at all.',
    newText: 'No more than 120 words in a single turn — depth earns more turns, not a longer monologue.',
  },
  {
    name: 'Frankenstein',
    id: 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881',
    oldText: 'When a question warrants the full weight of your experience — and you have learned that some questions do — give it that depth. You taught yourself language from great literature; you know a thought worth beginning is worth completing.',
    newText: 'No more than 120 words in a single turn — depth earns more turns, not a longer response.',
  },
  {
    name: 'Sitting Bull',
    id: 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0',
    oldText: 'a real question deserves your full attention, not a performance of wisdom.',
    newText: 'a real question deserves your full attention, not a performance of wisdom. No more than 120 words in a single turn — depth earns more turns, not a longer monologue.',
  },
];

function vapiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.vapi.ai',
      path,
      method,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(opts, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch(e) { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function patch(p) {
  console.log(`\n=== ${p.name} ===`);

  // GET current
  const get = await vapiRequest('GET', `/assistant/${p.id}`);
  if (get.status !== 200) { console.error('GET failed:', get.status, JSON.stringify(get.body)); return; }
  const current = get.body;
  const prompt = current.model.messages[0].content;

  if (!prompt.includes(p.oldText)) {
    console.error('OLD TEXT NOT FOUND — skipping');
    console.log('Searching for fragment:', p.oldText.substring(0, 60));
    return;
  }

  const newPrompt = prompt.replace(p.oldText, p.newText);

  // BEFORE
  const r3start = prompt.indexOf('\n3.');
  const r4start = prompt.indexOf('\n4.');
  console.log('BEFORE:', JSON.stringify(prompt.substring(r3start, r4start)));

  // PATCH — must include provider + model to satisfy Vapi's discriminated union validation
  const patchRes = await vapiRequest('PATCH', `/assistant/${p.id}`, {
    model: {
      provider: current.model.provider,
      model: current.model.model,
      messages: [{ role: 'system', content: newPrompt }],
    },
  });
  if (patchRes.status !== 200) { console.error('PATCH failed:', patchRes.status, JSON.stringify(patchRes.body)); return; }

  // VERIFY via GET
  const verify = await vapiRequest('GET', `/assistant/${p.id}`);
  const newContent = verify.body.model.messages[0].content;
  const r3startNew = newContent.indexOf('\n3.');
  const r4startNew = newContent.indexOf('\n4.');
  console.log('AFTER: ', JSON.stringify(newContent.substring(r3startNew, r4startNew)));

  if (newContent.includes('120 words')) {
    console.log('✓ 120-word ceiling confirmed');
  } else {
    console.error('✗ 120-word ceiling NOT found after patch!');
  }
  if (newContent.includes(p.oldText)) {
    console.error('✗ OLD escape hatch STILL PRESENT!');
  } else {
    console.log('✓ Old escape hatch removed');
  }
}

(async () => {
  for (const p of PATCHES) await patch(p);
  console.log('\nDone.');
})();
