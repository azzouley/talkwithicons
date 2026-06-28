// dump-prompts.js — dump system prompts for 5 Tier-1 assistants
// Run: node --use-system-ca dump-prompts.js

const https = require('https');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const ASSISTANTS = [
  { name: 'evangeline', id: '7fd88fa7-f013-4693-9b52-ab8937e4225d' },
  { name: 'aela',       id: '9647119e-7cf6-4d22-968d-25f3f455a834' },
];

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
        try { resolve(JSON.parse(d)); } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  for (const a of ASSISTANTS) {
    const data = await vapiGet(a.id);
    const prompt = data?.model?.messages?.find(m => m.role === 'system')?.content || '';
    console.log('\n' + '='.repeat(80));
    console.log(`CHARACTER: ${a.name.toUpperCase()} (${a.id})`);
    console.log('='.repeat(80));
    console.log(prompt);
  }
})();
