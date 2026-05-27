const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return res.status(500).json({ error: 'TAVILY_API_KEY not configured' });

  // Log the raw body so we can see exactly what Vapi sends
  console.log('tavily-search raw body:', JSON.stringify(req.body));
  console.log('tavily-search content-type:', req.headers['content-type']);

  // Extract query — try every known Vapi payload shape in order
  let query;
  try {
    const body = req.body || {};

    // Helper: parse if string, pass through if object
    const parse = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

    // Shape 1 (current Vapi): { message: { toolCalls: [{ function: { arguments: { query } } }] } }
    // arguments may be a JSON string
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
    console.error('tavily-search body parse error:', err.message);
  }

  console.log('tavily-search extracted query:', query);

  if (!query) {
    return res.status(400).json({
      error: 'query parameter is required',
      receivedBody: req.body,
    });
  }

  const payload = JSON.stringify({
    query,
    max_results: 5,
    search_depth: 'basic',
    include_answer: true,
  });

  const options = {
    hostname: 'api.tavily.com',
    path: '/search',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tavilyKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  try {
    const tavilyRes = await new Promise((resolve, reject) => {
      const request = https.request(options, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => resolve({ status: r.statusCode, body: data }));
      });
      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    if (tavilyRes.status !== 200) {
      console.error('Tavily error:', tavilyRes.status, tavilyRes.body);
      return res.status(502).json({ error: 'Tavily search failed', details: tavilyRes.body });
    }

    const results = JSON.parse(tavilyRes.body);

    const summary = results.answer
      ? `Answer: ${results.answer}\n\nSources:\n${(results.results || []).slice(0, 3).map(r => `- ${r.title}: ${r.url}`).join('\n')}`
      : (results.results || []).slice(0, 5).map(r => `${r.title}: ${r.content}`).join('\n\n');

    console.log('tavily-search success, summary length:', summary.length);
    return res.status(200).json({ result: summary });
  } catch (err) {
    console.error('tavily-search fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
