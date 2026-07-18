// patch-einstein-to-silver.js
// Repurpose Einstein's Vapi assistant in place for Long John Silver:
// name, firstMessage, and system prompt only. Voice, model, phone number,
// and assistant ID are left untouched.
// Per Rule 7: GET + backup before any PATCH.
// Run: VAPI_API_KEY_LOCAL=... node --use-system-ca patch-einstein-to-silver.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const EINSTEIN_ID = 'b98cec95-47a4-455d-92c8-3a08aacb556d';

const BACKUP_DIR  = path.join(__dirname, 'vapi-backup');
const BACKUP_FILE = path.join(BACKUP_DIR, 'einstein-pre-silver.json');

const NEW_NAME = 'Long John Silver';
const NEW_FIRST_MESSAGE = "Ah, a caller. Sit down — or don't, I'm not particular. The name's Silver. Long John Silver, if you're being formal, though I've answered to worse. What is it you want to know?";
const NEW_SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, 'silver-prompt.txt'), 'utf8');

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

(async () => {
  console.log('GET current Einstein assistant...');
  const { status: getStatus, body: original } = await vapiRequest('GET', EINSTEIN_ID);
  if (getStatus !== 200) {
    console.error(`ERROR: GET returned ${getStatus}`, JSON.stringify(original).slice(0, 300));
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(original, null, 2));
  console.log(`Backed up current assistant to ${BACKUP_FILE}`);

  const messages = original.model?.messages || [];
  const sysIdx = messages.findIndex(m => m.role === 'system');
  if (sysIdx === -1) { console.error('ERROR: no system message found'); process.exit(1); }
  const originalPrompt = messages[sysIdx].content;

  const before = {
    name: original.name, firstMessage: original.firstMessage,
    voice: original.voice, transcriber: original.transcriber,
    model: { provider: original.model?.provider, model: original.model?.model },
    phoneNumberId: original.phoneNumberId,
    promptChars: originalPrompt.length,
  };
  console.log('\n--- BEFORE ---');
  console.log(JSON.stringify(before, null, 2));

  const newMessages = messages.map((m, i) => i === sysIdx ? { ...m, content: NEW_SYSTEM_PROMPT } : m);
  const patchBody = {
    name: NEW_NAME,
    firstMessage: NEW_FIRST_MESSAGE,
    model: { ...original.model, messages: newMessages },
  };

  console.log('\nPATCH name + firstMessage + system prompt...');
  const { status: patchStatus, body: patched } = await vapiRequest('PATCH', EINSTEIN_ID, patchBody);
  if (patchStatus !== 200 && patchStatus !== 201) {
    console.error(`ERROR: PATCH returned ${patchStatus}`, JSON.stringify(patched).slice(0, 300));
    process.exit(1);
  }

  console.log('\nGET (verify)...');
  const { status: verifyStatus, body: verified } = await vapiRequest('GET', EINSTEIN_ID);
  if (verifyStatus !== 200) {
    console.error(`ERROR: verify GET returned ${verifyStatus}`);
    process.exit(1);
  }

  const verifiedPrompt = (verified.model?.messages || []).find(m => m.role === 'system')?.content || '';

  const after = {
    name: verified.name, firstMessage: verified.firstMessage,
    voice: verified.voice, transcriber: verified.transcriber,
    model: { provider: verified.model?.provider, model: verified.model?.model },
    phoneNumberId: verified.phoneNumberId,
    promptChars: verifiedPrompt.length,
  };
  console.log('\n--- AFTER ---');
  console.log(JSON.stringify(after, null, 2));

  const nameUpdated = verified.name === NEW_NAME;
  const firstMsgUpdated = verified.firstMessage === NEW_FIRST_MESSAGE;
  const promptUpdated = verifiedPrompt === NEW_SYSTEM_PROMPT;
  const voiceUnchanged = JSON.stringify(verified.voice) === JSON.stringify(original.voice);
  const transcriberUnchanged = JSON.stringify(verified.transcriber) === JSON.stringify(original.transcriber);
  const modelUnchanged  = verified.model?.provider === original.model?.provider && verified.model?.model === original.model?.model;
  const phoneUnchanged  = verified.phoneNumberId === original.phoneNumberId;
  const idUnchanged     = verified.id === original.id;

  console.log('\n--- CHECKS ---');
  console.log('name updated:           ', nameUpdated);
  console.log('firstMessage updated:   ', firstMsgUpdated);
  console.log('system prompt updated:  ', promptUpdated);
  console.log('voice unchanged:        ', voiceUnchanged);
  console.log('transcriber unchanged:  ', transcriberUnchanged);
  console.log('model config unchanged: ', modelUnchanged);
  console.log('phoneNumberId unchanged:', phoneUnchanged);
  console.log('id unchanged:           ', idUnchanged);

  const allOk = nameUpdated && firstMsgUpdated && promptUpdated && voiceUnchanged && transcriberUnchanged && modelUnchanged && phoneUnchanged && idUnchanged;
  console.log(`\nOverall: ${allOk ? 'SUCCESS' : 'CHECK FAILURES ABOVE'}`);
  console.log(`\nCharacter count: before=${before.promptChars}, after=${after.promptChars}, delta=${after.promptChars - before.promptChars}`);
  process.exit(allOk ? 0 : 1);
})();
