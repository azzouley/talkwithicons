// get-anecdotes-all12.js
// Read-only: GET all 12 Vapi assistants and save full system prompts to files for review.
// Does not modify anything.

const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const ROSTER = [
  ['einstein', 'b98cec95-47a4-455d-92c8-3a08aacb556d'],
  ['nostradamus', 'bca7797f-d4c5-4b67-b22c-7506a0b045b9'],
  ['davinci', '23ef91d2-fc8f-4fee-9c2e-25e93b51c331'],
  ['brucelee', '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141'],
  ['watson', 'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6'],
  ['aela', '9647119e-7cf6-4d22-968d-25f3f455a834'],
  ['celeste', '0560582f-8258-4803-8f2b-78b364fa23ca'],
  ['oswald', '2f0047c1-eeb7-412d-b455-f8f731bdd232'],
  ['evangeline', '7fd88fa7-f013-4693-9b52-ab8937e4225d'],
  ['houdini', 'ca384c56-f276-4940-b20b-1ae939bef23b'],
  ['frankenstein', 'f96bb0a5-6e8f-4153-8bee-6b76fa14f881'],
  ['sittingbull', 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0'],
];

function vapiGet(id) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'api.vapi.ai', path: `/assistant/${id}`, method: 'GET',
      headers: { Authorization: `Bearer ${KEY}` } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { reject(new Error('JSON parse error: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const outDir = path.join(__dirname, 'prompt-dumps');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const [name, id] of ROSTER) {
    const { status, body } = await vapiGet(id);
    if (status !== 200) { console.log(`${name}: GET FAILED (${status})`); continue; }
    const prompt = body.model?.messages?.find(m => m.role === 'system')?.content || '';
    fs.writeFileSync(path.join(outDir, `${name}.txt`), prompt);
    console.log(`${name}: saved (promptLen ${prompt.length})`);
  }
})();
