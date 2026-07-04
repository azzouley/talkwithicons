const fs = require('fs');
const https = require('https');

const API_KEY = process.env.VAPI_API_KEY_LOCAL;
if (!API_KEY) { console.error('Set VAPI_API_KEY_LOCAL'); process.exit(1); }

const CHARACTERS = [
  { name: 'einstein',         id: 'b98cec95-47a4-455d-92c8-3a08aacb556d' },
  { name: 'nostradamus',      id: 'bca7797f-d4c5-4b67-b22c-7506a0b045b9' },
  { name: 'davinci',          id: '23ef91d2-fc8f-4fee-9c2e-25e93b51c331' },
  { name: 'brucelee',         id: '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141' },
  { name: 'holmes',           id: 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6' },
  { name: 'aela',             id: '9647119e-7cf6-4d22-968d-25f3f455a834' },
  { name: 'bennet',           id: '0560582f-8258-4803-8f2b-78b364fa23ca' },
  { name: 'baldwin',          id: '2f0047c1-eeb7-412d-b455-f8f731bdd232' },
  { name: 'evangelineadams',  id: '7fd88fa7-f013-4693-9b52-ab8937e4225d' },
  { name: 'houdini',          id: 'ca384c56-f276-4940-b20b-1ae939bef23b' },
  { name: 'frankenstein',     id: 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881' },
  { name: 'sittingbull',      id: 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0' },
];

const DIR = 'C:/talkwithicons/vapi-backup-2026-07-04-global-beat-audit';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function vapiGet(id) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.vapi.ai',
      path: `/assistant/${id}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${buf}`));
        else resolve(JSON.parse(buf));
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  for (const char of CHARACTERS) {
    process.stdout.write(`Fetching ${char.name}...`);
    const data = await vapiGet(char.id);
    const prompt = data.model?.messages?.find(m => m.role === 'system')?.content || '';
    fs.writeFileSync(`${DIR}/${char.name}-before.json`, JSON.stringify(data, null, 2));
    fs.writeFileSync(`${DIR}/${char.name}-prompt.txt`, prompt);
    console.log(` ${prompt.length} chars`);
  }
  console.log('\nAll prompts saved to', DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
