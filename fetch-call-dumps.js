// fetch-call-dumps.js — pull call logs for Da Vinci, Bruce Lee, Houdini
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const DUMP_DIR = path.join(__dirname, 'call-dumps');
if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR);

function vapiGet(p) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.vapi.ai',
      path: p,
      method: 'GET',
      headers: { Authorization: 'Bearer ' + KEY },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { reject(new Error('JSON parse: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

const CALLS = [
  { name: 'davinci',  id: '019f0524-08fa-7000-90e9-bc60d676745e' },
  { name: 'davinci',  id: '019f0513-aa5b-7bbc-8fc4-ded9cabd87c4' },
  { name: 'brucelee', id: '019f09e6-61f5-777f-acb4-929ea9bece8a' },
  { name: 'brucelee', id: '019f09bf-1102-7000-83d8-de546c851fd7' },
  { name: 'brucelee', id: '019f0544-fae4-7001-98f7-bb05afe59044' },
  { name: 'brucelee', id: '019f019b-bf8d-7aab-94f2-e52a1733238f' },
  { name: 'houdini',  id: '019f0a54-0a5d-733a-a76a-01ba5dde0658' },
  { name: 'houdini',  id: '019f0a28-822e-7aa6-90e3-49e94ff79bba' },
];

(async () => {
  for (const c of CALLS) {
    const { status, body } = await vapiGet('/call/' + c.id);
    const outPath = path.join(DUMP_DIR, c.name + '-' + c.id + '.json');
    fs.writeFileSync(outPath, JSON.stringify(body, null, 2));
    console.log('Saved:', outPath, '(status=' + status + ', bytes=' + JSON.stringify(body).length + ')');
  }
  console.log('Done.');
})();
