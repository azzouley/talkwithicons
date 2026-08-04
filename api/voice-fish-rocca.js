// api/voice-fish-rocca.js
// Vapi custom-voice TTS proxy for Rocca — forwards Vapi's voice-request to
// Fish Audio's /v1/tts, and returns raw PCM in the exact format Vapi's
// custom-voice contract requires.

const FISH_API_KEY = process.env.FISH_API_KEY;
// TEMPORARY TEST 2026-08-04: swapped from "Warm Italian Elder" (f74dfbbaee68495c80572cf723cb74c7)
// to "Dramatic Italian Elder" to test whether emotional range is voice-dependent -
// acoustic testing showed this voice has real, measurable dynamic range that
// Warm Italian Elder did not. Ruby does not like this voice's character fit,
// this is purely to confirm the mechanism works before searching for a better match.
const FISH_VOICE_ID = '96626afb7ee74823b09f7d5b5c0b1b3d'; // "Dramatic Italian Elder"
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
        temperature: 0.85, // raised from Fish Audio's 0.7 default for more expressive dynamic range
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
