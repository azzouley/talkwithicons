// api/assemble-reel.js — reel assembly (captions + music bed), admin-triggered.
// Takes a completed Runway clip already persisted to Blob (per api/_runway.js)
// and produces a finished, postable reel: burned-in caption cards matching
// the script's beats, plus a royalty-free music bed. No voiceover, no real
// call audio — reels sell the question, never the answer.
//
// POST { action: 'assemble', sourceBlobUrl, script: {hook, body?, payoff?, cta?}, musicKey? }
//   -> {assemblyId, outputBlobUrl, musicKey, duration, segments}
// GET  ?action=music -> the curated royalty-free track library

const { checkAdminAuth } = require('./_db');
const { assembleReel, recordAssembly, MUSIC_LIBRARY, DEFAULT_MUSIC_KEY } = require('./_reel-assembly');

module.exports = async function handler(req, res) {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    if (req.method === 'GET' && req.query.action === 'music') {
      return res.status(200).json({ tracks: MUSIC_LIBRARY, default: DEFAULT_MUSIC_KEY });
    }

    if (req.method === 'POST' && req.body?.action === 'assemble') {
      const { sourceBlobUrl, script, musicKey } = req.body;
      if (!sourceBlobUrl) return res.status(400).json({ error: 'sourceBlobUrl required' });
      if (!script?.hook) return res.status(400).json({ error: 'script.hook required' });

      try {
        const result = await assembleReel({ sourceBlobUrl, script, musicKey });
        const assemblyId = await recordAssembly({
          sourceBlobUrl,
          script: { ...script, ctaMode: result.ctaMode },
          musicKey: result.musicKey,
          outputBlobUrl: result.outputBlobUrl,
          status: 'SUCCEEDED',
        });
        return res.status(200).json({ assemblyId, ...result });
      } catch (assembleErr) {
        await recordAssembly({
          sourceBlobUrl,
          script,
          musicKey: musicKey || DEFAULT_MUSIC_KEY,
          outputBlobUrl: null,
          status: 'FAILED',
          error: assembleErr.message,
        });
        throw assembleErr;
      }
    }

    return res.status(400).json({ error: 'unrecognized request — use POST {action:"assemble",...} or GET ?action=music' });
  } catch (err) {
    console.error('assemble-reel error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
