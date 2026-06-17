const https = require('https');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Missing authorization' });

  const b = req.body || {};
  const payload = {
    model: b.model,
    messages: b.messages,
    temperature: b.temperature,
    max_tokens: b.max_tokens,
    stream: true,
  };
  if (b.stop) payload.stop = b.stop;
  const bodyStr = JSON.stringify(payload);

  return new Promise(resolve => {
    const opts = {
      hostname: 'api.perplexity.ai',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const upstream = https.request(opts, upstreamRes => {
      if (upstreamRes.statusCode !== 200) {
        let errBody = '';
        upstreamRes.on('data', c => (errBody += c));
        upstreamRes.on('end', () => {
          res.status(upstreamRes.statusCode).setHeader('Content-Type', 'application/json').end(errBody);
          resolve();
        });
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        Connection: 'keep-alive',
      });

      let buf = '';
      upstreamRes.on('data', chunk => {
        buf += chunk.toString('utf8');
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            if (line.trim()) res.write(line + '\n');
            continue;
          }
          const data = line.slice(6).trim();
          if (data === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
          try {
            const obj = JSON.parse(data);
            delete obj.citations;
            delete obj.search_results;
            if (obj.choices?.[0]?.delta) delete obj.choices[0].delta.role;
            res.write('data: ' + JSON.stringify(obj) + '\n\n');
          } catch {
            if (line.trim()) res.write(line + '\n');
          }
        }
      });
      upstreamRes.on('end', () => { if (buf.trim()) res.write(buf + '\n'); res.end(); resolve(); });
      upstreamRes.on('error', () => { res.end(); resolve(); });
    });

    upstream.on('error', err => {
      if (!res.headersSent) res.status(502).json({ error: err.message });
      resolve();
    });
    upstream.write(bodyStr);
    upstream.end();
  });
};
