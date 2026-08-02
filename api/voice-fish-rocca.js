// api/voice-fish-rocca.js
// Vapi custom-voice TTS proxy for Rocca — forwards Vapi's voice-request to
// Fish Audio's /v1/tts using the "Warm Italian Elder" voice, and returns raw
// PCM in the exact format Vapi's custom-voice contract requires.

const FISH_API_KEY = process.env.FISH_API_KEY;
const FISH_VOICE_ID = 'f74dfbbaee68495c80572cf723cb74c7'; // "Warm Italian Elder"
const FISH_MODEL = 's2.1-pro-free'; // free tier through 2026-08-31, see fish.audio/blog/s2-1-pro-free-api

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const secret = process.env.VAPI_CUSTOM_VOICE_SECRET;
  if (secret && req.headers['x-vapi-secret'] !== secret) {
    res.status(401).end();
    return;
  }

  const message = req.body && req.body.message;
  if (!message || message.type !== 'voice-request' || !message.text) {
    res.status(400).json({ error: 'expected message.type === "voice-request" with text' });
    return;
  }

  const sampleRate = message.sampleRate || 24000;

  try {
    const fishRes = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FISH_API_KEY}`,
        'Content-Type': 'application/json',
        model: FISH_MODEL,
      },
      body: JSON.stringify({
        text: message.text,
        reference_id: FISH_VOICE_ID,
        format: 'pcm',
        sample_rate: sampleRate,
        latency: 'balanced',
      }),
    });

    if (!fishRes.ok) {
      const errText = await fishRes.text();
      console.error('Fish Audio TTS error', fishRes.status, errText);
      res.status(502).json({ error: 'upstream TTS failure' });
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/octet-stream');
    const { pipeline } = require('node:stream/promises');
    const { Readable } = require('node:stream');
    await pipeline(Readable.fromWeb(fishRes.body), res);
  } catch (err) {
    console.error('voice-fish-rocca error', err);
    res.status(500).json({ error: 'internal error' });
  }
};
