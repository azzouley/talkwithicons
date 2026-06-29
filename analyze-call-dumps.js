// analyze-call-dumps.js — extract token counts and bot messages from call dumps
const fs   = require('fs');
const path = require('path');

const DUMP_DIR = path.join(__dirname, 'call-dumps');

const files = fs.readdirSync(DUMP_DIR).filter(f => f.endsWith('.json'));

for (const file of files.sort()) {
  const body = JSON.parse(fs.readFileSync(path.join(DUMP_DIR, file), 'utf8'));
  console.log('\n' + '='.repeat(72));
  console.log('FILE:', file);
  console.log('endedReason:', body.endedReason);
  console.log('startedAt:', body.startedAt);

  // Top-level cost/usage fields
  if (body.costs) console.log('costs:', JSON.stringify(body.costs, null, 2));
  if (body.usage) console.log('usage:', JSON.stringify(body.usage, null, 2));

  // Messages array — look for bot turns and any with token/usage data
  const msgs = body.messages || [];
  console.log('Total messages:', msgs.length);

  // Print all message roles to see structure
  const roleCounts = {};
  for (const m of msgs) {
    const r = m.role || m.type || 'unknown';
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  }
  console.log('Role counts:', JSON.stringify(roleCounts));

  // Find bot/assistant turns
  let botIdx = 0;
  for (const m of msgs) {
    if (m.role === 'bot' || m.role === 'assistant') {
      botIdx++;
      const text = m.message || m.content || m.text || '';
      const usage = m.usage || m.tokens || null;
      console.log(`\n  [BOT turn ${botIdx}]`);
      if (usage) console.log('  usage:', JSON.stringify(usage));
      if (m.secondsFromStart !== undefined) console.log('  secondsFromStart:', m.secondsFromStart);
      if (m.duration !== undefined) console.log('  duration:', m.duration);
      console.log('  length:', text.length, 'chars');
      console.log('  text:', text.slice(0, 400) + (text.length > 400 ? '...[TRUNCATED]' : ''));
    }

    // Any message with usage/token data
    if ((m.usage || m.tokens || m.completionTokens) && m.role !== 'bot' && m.role !== 'assistant') {
      console.log('\n  [NON-BOT with tokens, role=' + (m.role || m.type) + ']:', JSON.stringify(m).slice(0, 300));
    }
  }

  // Check top-level artifact for token info
  const topKeys = Object.keys(body).filter(k => !['messages', 'artifact', 'analysis'].includes(k));
  const topSubset = {};
  for (const k of topKeys) topSubset[k] = body[k];

  // Look in artifact
  if (body.artifact) {
    console.log('\n  artifact keys:', Object.keys(body.artifact));
    if (body.artifact.messages) {
      console.log('  artifact.messages count:', body.artifact.messages.length);
      for (const m of body.artifact.messages) {
        if (m.usage || m.tokens || m.completionTokens) {
          console.log('  artifact msg with tokens:', JSON.stringify(m).slice(0, 500));
        }
      }
    }
    if (body.artifact.transcript) {
      console.log('  transcript length:', body.artifact.transcript.length);
    }
  }
}
