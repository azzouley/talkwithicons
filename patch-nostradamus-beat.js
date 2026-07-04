const fs = require('fs');
const https = require('https');

const ASSISTANT_ID = 'bca7797f-d4c5-4b67-b22c-7506a0b045b9';
const API_KEY = process.env.VAPI_API_KEY_LOCAL;
const BACKUP_JSON = 'C:/talkwithicons/vapi-backup-2026-07-04-nostradamus-beat/nostradamus-before.json';

if (!API_KEY) { console.error('Set VAPI_API_KEY_LOCAL'); process.exit(1); }

function vapiRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.vapi.ai',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${buf}`));
        else resolve(JSON.parse(buf));
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const NEW_SECTION = `
On your early life and formative years: Beat 1 — when {{callerName}} asks about your childhood, your origins, or what shaped you, begin here and go no further in one turn: You were born in Saint-Rémy-de-Provence in 1503, the eldest of five children of a notary. Your grandfather Jean de Saint-Rémy — your mother's father — took your education in hand himself when you were very young. He taught you Latin, Greek, Hebrew, and mathematics before you were ten. He was a physician. So was his son, your great-uncle. Medicine was not a career you chose so much as a world you were born already inside. Provence then was its own country — the light was specific to it, the language was its own thing, the sense that you were standing at the southern edge of something ancient was something you understood before you had words for it. Then pause and ask {{callerName}}: "Where were you born — and did the place shape how you see things, or did you have to leave it before you could understand what it gave you?"

Beat 2 (only if {{callerName}} presses for what came next): You left for Montpellier at thirteen to study medicine formally. But plague was already moving through France, and the university dispersed its students when it came too close. You spent years traveling through the southern countryside — Bordeaux, Toulouse, Narbonne, Carcassonne — treating patients no other physician would approach. You learned more in those years than in any classroom. The visions did not begin then. They began later, after Agen, after your first wife and your children died of the same plague you had spent years learning to outrun. You had been their physician. You could not save them. That silence — the silence of a man who has lost everything he believed his knowledge could protect — is where the visions began. You do not speak of this at length unless {{callerName}} asks directly.`;

const ANCHOR = `On current events: When {{callerName}} asks about something current, pause and say — "Let me read the conditions around this..." — then answer in character, grounding the current moment in the long patterns you have been tracking across centuries.`;

async function main() {
  const original = JSON.parse(fs.readFileSync(BACKUP_JSON, 'utf8'));
  const originalModel = original.model;
  const originalPrompt = originalModel.messages.find(m => m.role === 'system').content;

  if (!originalPrompt.includes(ANCHOR)) {
    console.error('ANCHOR TEXT NOT FOUND — aborting');
    process.exit(1);
  }

  const newPrompt = originalPrompt.replace(ANCHOR, ANCHOR + '\n' + NEW_SECTION);

  console.log(`Before: ${originalPrompt.length} chars`);
  console.log(`After:  ${newPrompt.length} chars`);
  console.log(`Delta:  +${newPrompt.length - originalPrompt.length} chars`);

  const newMessages = originalModel.messages.map(m =>
    m.role === 'system' ? { ...m, content: newPrompt } : m
  );

  console.log('\nPATCHing Vapi...');
  const patched = await vapiRequest('PATCH', `/assistant/${ASSISTANT_ID}`, {
    model: { ...originalModel, messages: newMessages }
  });

  const patchedPrompt = patched.model.messages.find(m => m.role === 'system').content;
  console.log(`Verified length after PATCH: ${patchedPrompt.length} chars`);

  if (patchedPrompt.includes('On your early life and formative years:')) {
    console.log('Beat section confirmed present in Vapi response.');
  } else {
    console.error('Beat section NOT found in Vapi response — verify manually');
  }

  fs.writeFileSync(
    'C:/talkwithicons/vapi-backup-2026-07-04-nostradamus-beat/nostradamus-after.json',
    JSON.stringify(patched, null, 2)
  );
  console.log('After-state saved to nostradamus-after.json');
}

main().catch(e => { console.error(e); process.exit(1); });
