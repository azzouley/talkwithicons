const https = require('https');
const zlib = require('zlib');

module.exports = async (req, res) => {
  console.log('BRAVE_API_KEY present:', !!process.env.BRAVE_API_KEY, 'key starts with:', process.env.BRAVE_API_KEY?.substring(0, 8));

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const braveKey = process.env.BRAVE_API_KEY;
  if (!braveKey) return res.status(500).json({ error: 'BRAVE_API_KEY not configured' });

  console.log('search raw body:', JSON.stringify(req.body));
  console.log('search content-type:', req.headers['content-type']);

  // Extract query — try every known Vapi payload shape in order
  let query;
  try {
    const body = req.body || {};
    const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

    // Shape 1 (current Vapi): { message: { toolCalls: [{ function: { arguments: { query } } }] } }
    const toolCall = body?.message?.toolCalls?.[0];
    if (toolCall) {
      const args = parse(toolCall?.function?.arguments);
      query = args?.query;
    }

    // Shape 2: { message: { functionCall: { parameters: { query } } } }  (older Vapi)
    if (!query) {
      const params = parse(body?.message?.functionCall?.parameters);
      query = params?.query;
    }

    // Shape 3: { functionCall: { parameters: { query } } }  (no message wrapper)
    if (!query) {
      const params = parse(body?.functionCall?.parameters);
      query = params?.query;
    }

    // Shape 4: { parameters: { query } }
    if (!query) {
      const params = parse(body?.parameters);
      query = params?.query;
    }

    // Shape 5: { query }  (direct / test calls)
    if (!query) {
      query = body?.query;
    }
  } catch (err) {
    console.error('search body parse error:', err.message);
  }

  console.log('search extracted query:', query);

  if (!query) {
    return res.status(400).json({
      error: 'query parameter is required',
      receivedBody: req.body,
    });
  }

  const options = {
    hostname: 'api.search.brave.com',
    path: `/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': braveKey,
    },
  };

  try {
    const braveRes = await new Promise((resolve, reject) => {
      const request = https.request(options, (r) => {
        let stream = r;
        if (r.headers['content-encoding'] === 'gzip') {
          stream = r.pipe(zlib.createGunzip());
        }
        let data = '';
        stream.on('data', chunk => data += chunk);
        stream.on('end', () => resolve({ status: r.statusCode, body: data }));
        stream.on('error', reject);
      });
      request.on('error', reject);
      request.end();
    });

    console.log('Brave status:', braveRes.status);

    if (braveRes.status !== 200) {
      console.error('Brave error:', braveRes.status, braveRes.body);
      return res.status(502).json({ error: 'Brave Search failed', details: braveRes.body });
    }

    const data = JSON.parse(braveRes.body);
    const results = data?.web?.results || [];

    const summary = results.slice(0, 3).map(r =>
      `${r.title}\n${r.description || ''}\n${r.url}`
    ).join('\n\n');

    console.log('search success, results:', results.length);
    return res.status(200).json({ result: summary || 'No results found.' });
  } catch (err) {
    console.error('search fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
