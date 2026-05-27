const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) return res.status(500).json({ error: 'TAVILY_API_KEY not configured' });

  // Vapi sends function call payloads with the args inside message.functionCall.parameters
  // or directly as the body depending on version — handle both
  let query;
  try {
    const body = req.body || {};
    const params = body?.message?.functionCall?.parameters || body?.parameters || body;
    query = params?.query || params?.arguments?.query;
    if (!query && typeof params === 'string') {
      query = JSON.parse(params)?.query;
    }
  } catch (_) {}

  if (!query) return res.status(400).json({ error: 'query parameter is required' });

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
      return res.status(502).json({ error: 'Tavily search failed', details: tavilyRes.body });
    }

    const results = JSON.parse(tavilyRes.body);

    // Return a concise result string Vapi can pass back to the assistant
    const summary = results.answer
      ? `Answer: ${results.answer}\n\nSources:\n${(results.results || []).slice(0, 3).map(r => `- ${r.title}: ${r.url}`).join('\n')}`
      : (results.results || []).slice(0, 5).map(r => `${r.title}: ${r.content}`).join('\n\n');

    return res.status(200).json({ result: summary });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
