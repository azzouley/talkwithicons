const https = require('https');

module.exports = async (req, res) => {
  console.log('BRAVE_API_KEY starts with:', process.env.BRAVE_API_KEY?.substring(0, 8));

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  console.log('raw body keys:', Object.keys(body));

  // Vapi sends toolCalls or toolCallList — handle both
  const toolCallEntry = body?.message?.toolCalls?.[0] ?? body?.message?.toolCallList?.[0];
  const toolCallId = toolCallEntry?.id ?? null;

  let rawArgs = toolCallEntry?.function?.arguments;
  if (typeof rawArgs === 'string') {
    try { rawArgs = JSON.parse(rawArgs); } catch { rawArgs = {}; }
  }
  const query = rawArgs?.query
    ?? body?.message?.functionCall?.parameters?.query
    ?? body?.query;

  console.log('toolCallId:', toolCallId, 'query:', query);
  if (!query) {
    console.log('full body:', JSON.stringify(body).slice(0, 1000));
    return res.status(400).json({ error: 'query required' });
  }

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

  const webResults = JSON.parse(searchRes.body)?.web?.results ?? [];
  const resultText = webResults.slice(0, 3).map(r => `${r.title}: ${r.description || r.url}`).join('\n') || 'No results found.';

  console.log('result string:', resultText.slice(0, 200));

  // Vapi custom-tool server protocol: respond with results array keyed by toolCallId.
  // If no toolCallId (direct test), fall back to simple { result } shape.
  const responseBody = toolCallId
    ? { results: [{ toolCallId, result: resultText }] }
    : { result: resultText };

  return res.status(200).json(responseBody);
};
