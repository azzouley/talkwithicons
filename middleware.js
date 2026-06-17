export const config = { matcher: ['/api/perplexity-proxy'] };

export default async function middleware(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const auth = req.headers.get('authorization');
  if (!auth) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let b;
  try { b = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const payload = { model: b.model, messages: b.messages, stream: true };
  if (b.temperature !== undefined) payload.temperature = b.temperature;
  if (b.max_tokens   !== undefined) payload.max_tokens   = b.max_tokens;
  if (b.stop         !== undefined) payload.stop         = b.stop;

  const upstream = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transform = new TransformStream({
    start() { this.buf = ''; },
    transform(chunk, controller) {
      this.buf += decoder.decode(chunk, { stream: true });
      const lines = this.buf.split('\n');
      this.buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) {
          if (line.trim()) controller.enqueue(encoder.encode(line + '\n'));
          continue;
        }
        const data = line.slice(6).trim();
        if (data === '[DONE]') { controller.enqueue(encoder.encode('data: [DONE]\n\n')); continue; }
        try {
          const obj = JSON.parse(data);
          delete obj.citations;
          delete obj.search_results;
          if (obj.choices?.[0]?.delta) delete obj.choices[0].delta.role;
          controller.enqueue(encoder.encode('data: ' + JSON.stringify(obj) + '\n\n'));
        } catch {
          if (line.trim()) controller.enqueue(encoder.encode(line + '\n'));
        }
      }
    },
    flush(controller) {
      if (this.buf.trim()) controller.enqueue(encoder.encode(this.buf + '\n'));
    },
  });

  return new Response(upstream.body.pipeThrough(transform), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}