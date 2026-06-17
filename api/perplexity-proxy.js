const https = require('https');

module.exports = async (req, res) => {
  const tag = `[proxy ${Date.now()}]`;

  if (req.method !== 'POST') {
    console.log(tag, 'rejected non-POST', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers['authorization'];
  if (!auth) {
    console.log(tag, 'rejected: missing authorization');
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const b = req.body || {};
  const payload = {
    model: b.model,
    messages: b.messages,
    temperature: b.temperature,
    max_tokens: b.max_tokens,
    stream: true,
  };
  if (b.stop) payload.stop = b.stop;

  // Log what Vapi sent us (truncate messages content for brevity)
  const msgSummary = (b.messages || []).map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content.slice(0, 120) : m.content,
  }));
  console.log(tag, 'VAPI->PROXY request:', JSON.stringify({
    model: b.model,
    temperature: b.temperature,
    max_tokens: b.max_tokens,
    messageCount: (b.messages || []).length,
    messages: msgSummary,
    extraKeys: Object.keys(b).filter(k => !['model','messages','temperature','max_tokens','stream','stop'].includes(k)),
  }));

  const bodyStr = JSON.stringify(payload);
  console.log(tag, 'PROXY->PERPLEXITY payload size:', bodyStr.length, 'bytes');

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
      console.log(tag, 'PERPLEXITY->PROXY status:', upstreamRes.statusCode);

      if (upstreamRes.statusCode !== 200) {
        let errBody = '';
        upstreamRes.on('data', c => (errBody += c));
        upstreamRes.on('end', () => {
          console.log(tag, 'PERPLEXITY error body:', errBody.slice(0, 500));
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
      let chunkCount = 0;
      let totalTokens = 0;
      let firstChunkLogged = false;

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
          if (data === '[DONE]') {
            console.log(tag, 'PROXY->VAPI [DONE] — chunks forwarded:', chunkCount, 'approx tokens:', totalTokens);
            res.write('data: [DONE]\n\n');
            continue;
          }
          try {
            const obj = JSON.parse(data);
            const hadRole = !!(obj.choices?.[0]?.delta?.role);
            const hadCitations = !!obj.citations;
            delete obj.citations;
            delete obj.search_results;
            if (obj.choices?.[0]?.delta) delete obj.choices[0].delta.role;

            const content = obj.choices?.[0]?.delta?.content || '';
            totalTokens += content ? 1 : 0;
            chunkCount++;

            if (!firstChunkLogged) {
              firstChunkLogged = true;
              console.log(tag, 'FIRST chunk (pre-strip):', JSON.stringify({
                hadRole, hadCitations,
                deltaKeys: Object.keys(obj.choices?.[0]?.delta || {}),
                contentPreview: content.slice(0, 80),
              }));
            }
            if (chunkCount <= 3 || chunkCount % 20 === 0) {
              console.log(tag, `chunk #${chunkCount}:`, JSON.stringify({ hadRole, content: content.slice(0,60) }));
            }

            res.write('data: ' + JSON.stringify(obj) + '\n\n');
          } catch {
            if (line.trim()) res.write(line + '\n');
          }
        }
      });

      upstreamRes.on('end', () => {
        if (buf.trim()) res.write(buf + '\n');
        console.log(tag, 'stream ended — total chunks:', chunkCount);
        res.end();
        resolve();
      });
      upstreamRes.on('error', err => {
        console.log(tag, 'upstream stream error:', err.message);
        res.end();
        resolve();
      });
    });

    upstream.on('error', err => {
      console.log(tag, 'upstream connection error:', err.message);
      if (!res.headersSent) res.status(502).json({ error: err.message });
      resolve();
    });

    upstream.write(bodyStr);
    upstream.end();
  });
};
