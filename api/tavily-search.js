const https = require('https');

module.exports = async (req, res) => {
  console.log('BRAVE_API_KEY starts with:', process.env.BRAVE_API_KEY?.substring(0, 8));

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};

  let rawArgs = body?.message?.toolCalls?.[0]?.function?.arguments;
  if (typeof rawArgs === 'string') rawArgs = JSON.parse(rawArgs);
  let query = rawArgs?.query
    || body?.message?.functionCall?.parameters?.query
    || body?.query;

  console.log('query:', query);
  if (!query) return res.status(400).json({ error: 'query required', body });

  const braveKey = process.env.BRAVE_API_KEY;
  if (!braveKey) return res.status(500).json({ error: 'BRAVE_API_KEY not set' });

  const searchRes = await new Promise((resolve, reject) => {
    const req2 = https.request({
      hostname: 'api.search.brave.com',
      path: `/res/v1/web/search?q=${encodeURIComponent(query)}`,
      method: 'GET',
      headers: {
        'X-Subscription-Token': braveKey,
        'Accept': 'application/json',
      },
    }, (r) => {
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => resolve({ status: r.statusCode, body: data }));
    });
    req2.on('error', reject);
    req2.end();
  });

  console.log('Brave status:', searchRes.status);
  if (searchRes.status !== 200) return res.status(502).json({ error: 'Brave failed', detail: searchRes.body });

  const results = JSON.parse(searchRes.body)?.web?.results || [];
  const result = results.slice(0, 3).map(r => `${r.title}: ${r.description || r.url}`).join('\n');

  return res.status(200).json({ result: result || 'No results found.' });
};
