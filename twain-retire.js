// twain-retire.js
// Step 1: GET + backup phone number af4c55a0, then PATCH assistantId to real Da Vinci (23ef91d2)
// Step 2: GET + backup Twain assistant 3a6a8107, then DELETE it
// Per Rule 7: full backups before any destructive action.

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL required'); process.exit(1); }

const TWAIN_ASSISTANT_ID  = '3a6a8107-3faf-4cdd-a67b-5f71023c027d';
const DAVINCI_REAL_ID     = '23ef91d2-fc8f-4fee-9c2e-25e93b51c331';
const PHONE_NUMBER_ID     = 'af4c55a0-227b-4c44-b44f-6254aa8f5617';

const BACKUP_DIR = 'C:/talkwithicons/vapi-backup-2026-06-27-twain-retire';
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function vapiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.vapi.ai', path: urlPath, method,
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = ''; res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.setTimeout(20000, () => req.destroy());
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {

  // ── STEP 1: Phone number ──────────────────────────────────────────────────

  console.log('\n=== STEP 1: Phone number af4c55a0 ===');

  // GET pre-patch backup
  process.stdout.write('GET pre-patch phone number... ');
  const prePhoneRes = await vapiRequest('GET', `/phone-number/${PHONE_NUMBER_ID}`);
  if (prePhoneRes.status !== 200) {
    console.log(`FAILED (${prePhoneRes.status}): ${prePhoneRes.body.slice(0, 200)}`);
    process.exit(1);
  }
  const prePhone = JSON.parse(prePhoneRes.body);
  fs.writeFileSync(path.join(BACKUP_DIR, 'phone-af4c55a0-pre-retire.json'), JSON.stringify(prePhone, null, 2));
  console.log(`OK`);
  console.log(`  Current name: ${prePhone.name}`);
  console.log(`  Number: ${prePhone.number}`);
  console.log(`  Current assistantId: ${prePhone.assistantId} (${prePhone.assistantId === TWAIN_ASSISTANT_ID ? 'Twain — expected' : 'UNEXPECTED VALUE'})`);

  // PATCH assistantId to real Da Vinci
  process.stdout.write(`PATCH assistantId → ${DAVINCI_REAL_ID} (real Da Vinci)... `);
  const patchPhoneRes = await vapiRequest('PATCH', `/phone-number/${PHONE_NUMBER_ID}`, {
    assistantId: DAVINCI_REAL_ID,
  });
  if (patchPhoneRes.status !== 200 && patchPhoneRes.status !== 201) {
    console.log(`FAILED (${patchPhoneRes.status}): ${patchPhoneRes.body.slice(0, 200)}`);
    process.exit(1);
  }
  const patchedPhone = JSON.parse(patchPhoneRes.body);
  console.log(`OK`);

  // Verify
  const phoneOk = patchedPhone.assistantId === DAVINCI_REAL_ID;
  console.log(`  Verify assistantId: ${patchedPhone.assistantId} → ${phoneOk ? 'CORRECT (real Da Vinci) ✓' : 'MISMATCH ⚠'}`);
  fs.writeFileSync(path.join(BACKUP_DIR, 'phone-af4c55a0-post-retire.json'), JSON.stringify(patchedPhone, null, 2));

  if (!phoneOk) {
    console.log('Phone number patch failed verification — aborting before assistant deletion.');
    process.exit(1);
  }

  // ── STEP 2: Twain assistant ───────────────────────────────────────────────

  console.log('\n=== STEP 2: Twain assistant 3a6a8107 ===');

  // GET backup before deletion
  process.stdout.write('GET Twain assistant (final backup before DELETE)... ');
  const preTwainRes = await vapiRequest('GET', `/assistant/${TWAIN_ASSISTANT_ID}`);
  if (preTwainRes.status !== 200) {
    console.log(`FAILED (${preTwainRes.status}): ${preTwainRes.body.slice(0, 200)}`);
    process.exit(1);
  }
  const preTwain = JSON.parse(preTwainRes.body);
  fs.writeFileSync(path.join(BACKUP_DIR, 'twain-assistant-final.json'), JSON.stringify(preTwain, null, 2));
  console.log(`OK`);
  console.log(`  Name in Vapi: ${preTwain.name}`);
  console.log(`  Model: ${preTwain.model?.provider} / ${preTwain.model?.model}`);
  console.log(`  maxTokens: ${preTwain.model?.maxTokens}`);
  console.log(`  Backed up to: ${path.join(BACKUP_DIR, 'twain-assistant-final.json')}`);

  // DELETE
  process.stdout.write('DELETE Twain assistant... ');
  const deleteRes = await vapiRequest('DELETE', `/assistant/${TWAIN_ASSISTANT_ID}`);
  if (deleteRes.status !== 200 && deleteRes.status !== 204) {
    console.log(`FAILED (${deleteRes.status}): ${deleteRes.body.slice(0, 200)}`);
    process.exit(1);
  }
  console.log(`OK (HTTP ${deleteRes.status})`);

  // Verify deletion — expect 404
  process.stdout.write('Verify deletion (expect 404)... ');
  const verifyRes = await vapiRequest('GET', `/assistant/${TWAIN_ASSISTANT_ID}`);
  if (verifyRes.status === 404) {
    console.log(`OK — 404 confirmed, assistant is gone ✓`);
  } else {
    console.log(`UNEXPECTED status ${verifyRes.status} — verify manually`);
  }

  console.log('\n=== DONE ===');
  console.log('Phone number af4c55a0: inbound routing now points to real Da Vinci (23ef91d2) ✓');
  console.log('Twain assistant 3a6a8107: deleted ✓');
  console.log(`Backups in: ${BACKUP_DIR}`);
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
