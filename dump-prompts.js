// dump-prompts.js — dump system prompts for 5 Tier-1 assistants
// Run: node --use-system-ca dump-prompts.js

const https = require('https');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const ASSISTANTS = [
  { name: 'houdini',      id: 'ca384c56-f276-4940-b20b-1ae939bef23b' },
  { name: 'davinci',      id: '23ef91d2-fc8f-4fee-9c2e-25e93b51c331' },
  { name: 'frankenstein', id: 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881' },
  { name: 'baldwin',      id: '2f0047c1-eeb7-412d-b455-f8f731bdd232' },
  { name: 'nostradamus',  id: 'bca7797f-d4c5-4b67-b22c-7506a0b045b9' },
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
