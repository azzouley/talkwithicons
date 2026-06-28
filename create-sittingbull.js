// create-sittingbull.js
// Creates the Sitting Bull Vapi assistant.
// Step 1: GET an existing assistant to capture exact tool + voice JSON structure.
// Step 2: POST /assistant with the new system prompt and matched config.
// Run: node --use-system-ca create-sittingbull.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

// Use Einstein as the config reference (known good: gpt-4o, openai, 250, search_web, 11labs)
const REFERENCE_ID = 'b98cec95-47a4-455d-92c8-3a08aacb556d';

const PROMPT_FILE = path.join(__dirname, 'sittingbull_system_prompt.txt');
const systemPrompt = fs.readFileSync(PROMPT_FILE, 'utf8');

function vapiRequest(method, pathStr, body) {
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.vapi.ai',
      path:     pathStr,
      method,
      headers: {
        Authorization: `Bearer ${KEY}`,
        ...(payload ? {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(payload),
        } : {}),
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { reject(new Error('JSON parse error: ' + d.slice(0, 300))); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  // ── Step 1: GET reference assistant ──────────────────────────────────────────
  console.log(`Fetching reference assistant (Einstein: ${REFERENCE_ID})...`);
  const { status: refStatus, body: ref } = await vapiRequest('GET', `/assistant/${REFERENCE_ID}`);
  if (refStatus !== 200) {
    console.error(`ERROR: GET reference returned ${refStatus}`, JSON.stringify(ref).slice(0, 300));
    process.exit(1);
  }

  console.log('\n--- Reference assistant config summary ---');
  console.log('model:            ', ref?.model?.model);
  console.log('provider:         ', ref?.model?.provider);
  console.log('maxTokens:        ', ref?.model?.maxTokens);
  console.log('maxDurationSecs:  ', ref?.maxDurationSeconds);
  console.log('voice.provider:   ', ref?.voice?.provider);
  console.log('voice.voiceId:    ', ref?.voice?.voiceId);
  console.log('tools count:      ', ref?.model?.tools?.length ?? 0);
  if (ref?.model?.tools?.length) {
    ref.model.tools.forEach((t, i) => {
      console.log(`  tool[${i}]:`, JSON.stringify(t).slice(0, 120));
    });
  }

  // Save reference for inspection
  fs.writeFileSync(
    path.join(__dirname, 'sittingbull-reference-config.json'),
    JSON.stringify(ref, null, 2)
  );
  console.log('\nReference saved to sittingbull-reference-config.json');

  // ── Step 2: Build the new assistant payload ───────────────────────────────────
  // Copy tools and voice exactly from reference; replace system prompt and name.
  const newAssistant = {
    name: 'sittingbull',
    model: {
      provider:  ref.model.provider,
      model:     ref.model.model,
      maxTokens: ref.model.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
      ],
      tools: ref.model.tools || [],
    },
    voice: {
      // Copy provider + voiceId exactly from reference as a temporary placeholder.
      // The voiceId here is TEMPORARY — a permanent voice must be selected via
      // ElevenLabs Voice Design before this assistant goes live.
      provider: ref.voice?.provider || '11labs',
      voiceId:  ref.voice?.voiceId  || 'placeholder-replace-before-launch',
    },
    maxDurationSeconds: ref.maxDurationSeconds || 2400,
    // firstMessage intentionally omitted — to be decided separately
  };

  console.log('\n--- New assistant payload summary ---');
  console.log('name:             ', newAssistant.name);
  console.log('model:            ', newAssistant.model.model);
  console.log('provider:         ', newAssistant.model.provider);
  console.log('maxTokens:        ', newAssistant.model.maxTokens);
  console.log('maxDurationSecs:  ', newAssistant.maxDurationSeconds);
  console.log('voice.provider:   ', newAssistant.voice.provider);
  console.log('voice.voiceId:    ', newAssistant.voice.voiceId, '  ← TEMPORARY PLACEHOLDER');
  console.log('tools count:      ', newAssistant.model.tools.length);
  console.log('prompt length:    ', systemPrompt.length, 'chars');

  // ── Step 3: POST /assistant ───────────────────────────────────────────────────
  console.log('\nPOSTing new assistant...');
  const { status: createStatus, body: created } = await vapiRequest('POST', '/assistant', newAssistant);

  if (createStatus !== 200 && createStatus !== 201) {
    console.error(`ERROR: POST returned ${createStatus}`);
    console.error(JSON.stringify(created, null, 2).slice(0, 500));
    process.exit(1);
  }

  console.log('\n✓ Assistant created successfully.');
  console.log('  ID:       ', created.id);
  console.log('  name:     ', created.name);
  console.log('  model:    ', created.model?.model);
  console.log('  provider: ', created.model?.provider);
  console.log('  maxTokens:', created.model?.maxTokens);
  console.log('  maxDur:   ', created.maxDurationSeconds);
  console.log('  voice:    ', created.voice?.provider, '/', created.voice?.voiceId, '  ← TEMPORARY');

  // ── Step 4: Verify — GET the new assistant back ───────────────────────────────
  console.log('\nVerifying via GET...');
  const { status: vStatus, body: verified } = await vapiRequest('GET', `/assistant/${created.id}`);
  if (vStatus !== 200) {
    console.error(`ERROR: verify GET returned ${vStatus}`);
    process.exit(1);
  }

  const vPrompt = verified?.model?.messages?.find(m => m.role === 'system')?.content || '';
  const promptOk = vPrompt.length > 1000;
  console.log(`  System prompt in Vapi: ${vPrompt.length} chars — ${promptOk ? 'OK' : 'SUSPICIOUSLY SHORT'}`);
  console.log(`  First 80 chars: "${vPrompt.slice(0, 80).replace(/\n/g, ' ')}"`);

  // Save created assistant JSON
  const outFile = path.join(__dirname, `sittingbull-created-${created.id}.json`);
  fs.writeFileSync(outFile, JSON.stringify(verified, null, 2));
  console.log(`\nFull assistant JSON saved to ${path.basename(outFile)}`);

  console.log('\n════════════════════════════════════════');
  console.log('NEW ASSISTANT ID:', created.id);
  console.log('════════════════════════════════════════');
  console.log('\nPENDING before going live:');
  console.log('  1. Voice — select permanently via ElevenLabs Voice Design');
  console.log('     (current voiceId is TEMPORARY: copied from Einstein)');
  console.log('  2. firstMessage — decide separately');
  console.log('  3. Env var VAPI_ASSISTANT_ID_SITTINGBULL — add to Vercel');
  console.log('  4. start-call-basic.js — add sittingbull to ASSISTANT_IDS/PHONE_NUMBER_IDS');
  console.log('  5. Site files — sittingbull.html, index.html update (separate step)');
  console.log('  6. La Llorona retirement — separate deliberate step');
})();
