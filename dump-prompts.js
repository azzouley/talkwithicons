// dump-prompts.js — dump system prompts for 5 Tier-1 assistants
// Run: node --use-system-ca dump-prompts.js

const https = require('https');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const ASSISTANTS = [
  { name: 'einstein', id: 'b98cec95-47a4-455d-92c8-3a08aacb556d' },
  { name: 'holmes',   id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6' },
  { name: 'brucelee', id: '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141' },
  { name: 'bennet',   id: '0560582f-8258-4803-8f2b-78b364fa23ca' },
  { name: 'llorona',  id: 'a30672aa-7bbb-4cff-91ed-7a2f01b5823a' },
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
