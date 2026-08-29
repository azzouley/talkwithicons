// api/_reel-assembly.js — shared reel-assembly client (captions + music bed).
// Underscore prefix: excluded from Vercel routing (not a public endpoint).
//
// Takes a raw Runway clip (already persisted to Blob per api/_runway.js) plus
// a small script object, burns in caption cards at timestamps matching the
// script's beats, mixes in a royalty-free music bed, and re-hosts the
// finished, postable reel in Vercel Blob — same persistence pattern as
// _runway.js's persistOutputToBlob.
//
// No voiceover and no real call audio: reels sell the question, never the
// answer, so the only audio here is the licensed music bed.

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const ffmpegPath = require('ffmpeg-static');
const { put } = require('@vercel/blob');
const { sql } = require('./_db');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const FONT_PATH = path.join(ASSETS_DIR, 'fonts', 'Anton-Regular.ttf');
const MUSIC_DIR = path.join(ASSETS_DIR, 'music');
const MUSIC_LIBRARY = JSON.parse(fs.readFileSync(path.join(MUSIC_DIR, 'manifest.json'), 'utf8'));
const DEFAULT_MUSIC_KEY = 'mystery-tension';

function getMusicTrack(musicKey) {
  const key = musicKey || DEFAULT_MUSIC_KEY;
  const track = MUSIC_LIBRARY.find(t => t.key === key);
  if (!track) {
    throw new Error(`Unknown music key "${key}". Available: ${MUSIC_LIBRARY.map(t => t.key).join(', ')}`);
  }
  return { ...track, path: path.join(MUSIC_DIR, track.file) };
}

// ffmpeg's filter-option parser treats ":" as a field separator, which
// collides with a Windows drive letter (c:/...). Escaping it as "\:" makes
// the path safe to embed inside a drawtext filter string on any platform.
function escapeForFilter(p) {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:');
}

// drawtext has no built-in word-wrap, so lines are pre-broken to fit the
// caption card's width at the chosen fontsize. The per-character width is an
// approximation tuned for Anton (a heavy, fairly condensed sans) — good
// enough for a first pass that gets reviewed visually before use.
function wrapText(text, fontsize, videoWidth) {
  const usableWidth = videoWidth * 0.82;
  const avgCharWidth = fontsize * 0.58;
  const maxCharsPerLine = Math.max(6, Math.floor(usableWidth / avgCharWidth));

  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}

// Longer captions get a smaller fontsize so a paragraph-length payoff line
// doesn't require an oversized card or run off the bottom of the frame.
function fontSizeFor(text, videoWidth) {
  const base = Math.round(videoWidth * 0.08);
  if (text.length <= 20) return base;
  if (text.length <= 40) return Math.round(base * 0.85);
  if (text.length <= 70) return Math.round(base * 0.7);
  return Math.round(base * 0.6);
}

// Splits the clip's duration into caption beats: hook at the start, body (if
// given) through the middle, then a reserved CTA hold at the very end —
// matching "hook at 0-2s, body text through the middle," scaled for clips
// that aren't exactly 5s. The CTA now shows the site URL as plain on-screen
// text (works identically on Instagram, Facebook, or anywhere else the reel
// gets posted, unlike a tap-the-handle instruction), so it needs real dwell
// time to actually be read or typed from — 3-4s minimum, not a quick flash
// like the other beats.
function computeSegments(script, duration) {
  const segments = [];
  let cursor = 0;

  if (script.hook) {
    const hookEnd = Math.min(2, duration * 0.4);
    segments.push({ text: script.hook, start: 0, end: hookEnd, type: 'hook' });
    cursor = hookEnd;
  }

  const ctaLen = script.cta ? Math.min(3.5, duration * 0.4) : 0;
  const ctaStart = Math.max(cursor, duration - ctaLen);

  const middleTexts = [
    script.body && { text: script.body, type: 'body' },
    script.payoff && { text: script.payoff, type: 'payoff' },
  ].filter(Boolean);

  if (middleTexts.length && ctaStart > cursor) {
    const totalChars = middleTexts.reduce((n, m) => n + m.text.length, 0);
    let t = cursor;
    for (const { text, type } of middleTexts) {
      const share = (text.length / totalChars) * (ctaStart - cursor);
      segments.push({ text, start: t, end: t + share, type });
      t += share;
    }
  }

  if (script.cta) {
    segments.push({ text: script.cta, start: ctaStart, end: duration, type: 'cta' });
  }

  return segments.filter(s => s.end > s.start);
}

async function probeDuration(filePath) {
  // ffmpeg-static only ships ffmpeg, not ffprobe. Running ffmpeg with no
  // output file exits non-zero, but it prints stream info (incl. Duration)
  // to stderr first — the promisified execFile rejects with that stderr
  // attached, which is what's actually being read here.
  let stderr = '';
  try {
    await execFileAsync(ffmpegPath, ['-i', filePath]);
  } catch (err) {
    stderr = err.stderr || '';
  }
  const match = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(stderr);
  if (!match) throw new Error('Could not determine source clip duration');
  const [, hh, mm, ss] = match;
  return parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseFloat(ss);
}

// A brief black-screen text card before the clip starts — a pattern
// interrupt to stop the scroll, distinct from the in-video caption cards.
// Defaults to the hook line at 0.6s unless the caller supplies its own.
function resolveFlashCards(script) {
  if (Array.isArray(script.flashCards) && script.flashCards.length) {
    return script.flashCards.map(c => ({ text: c.text, duration: c.duration || 0.6 }));
  }
  return [{ text: script.hook, duration: 0.6 }];
}

async function assembleReel({ sourceBlobUrl, script, musicKey }) {
  if (!sourceBlobUrl) throw new Error('sourceBlobUrl required');
  if (!script || !script.hook) throw new Error('script.hook required');

  const track = getMusicTrack(musicKey);
  const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'reel-'));
  const clipPath = path.join(workDir, 'source.mp4');
  const outputPath = path.join(workDir, 'output.mp4');

  try {
    const clipRes = await fetch(sourceBlobUrl);
    if (!clipRes.ok) throw new Error(`Fetching source clip failed: HTTP ${clipRes.status}`);
    await fsp.writeFile(clipPath, Buffer.from(await clipRes.arrayBuffer()));

    const duration = await probeDuration(clipPath);
    const videoWidth = 720; // matches the vertical-reel ratio (720:1280) submitted to Runway
    const videoHeight = 1280;

    // CTA close: 'url' (default) shows the site URL as plain on-screen text
    // ("talkwithicons.com") — true and actionable regardless of which
    // platform the reel ends up on (Instagram, Facebook cross-post,
    // anywhere else), unlike an instruction to tap a handle overlay whose
    // position is platform-specific and which doesn't even deliver a call
    // in one tap on Instagram itself. 'link' and 'follow' are opt-in
    // overrides for a known single-platform context where pointing at the
    // account handle actually applies — only those two get the arrow +
    // bottom-left pointer treatment; 'url' renders like any other caption.
    const ctaMode = script.ctaMode || 'url';
    const isPointerMode = ctaMode === 'link' || ctaMode === 'follow';

    const segments = computeSegments(script, duration);
    const drawtextFilters = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isPointerCta = seg.type === 'cta' && isPointerMode;
      const text = isPointerCta && !/[↓]/.test(seg.text) ? `${seg.text} ↓` : seg.text;
      const fontsize = fontSizeFor(text, videoWidth);
      const wrapped = wrapText(text, fontsize, videoWidth);
      const textFilePath = path.join(workDir, `cap-${i}.txt`);
      await fsp.writeFile(textFilePath, wrapped, 'utf8');

      const position = isPointerCta ? `x=40:y=h*0.74` : `x=(w-text_w)/2:y=h*0.08`;

      drawtextFilters.push(
        `drawtext=fontfile='${escapeForFilter(FONT_PATH)}'` +
        `:textfile='${escapeForFilter(textFilePath)}'` +
        `:fontcolor=black:fontsize=${fontsize}:line_spacing=10` +
        `:box=1:boxcolor=white@0.92:boxborderw=28` +
        `:${position}` +
        `:enable='between(t,${seg.start.toFixed(2)},${seg.end.toFixed(2)})'`
      );
    }

    const flashCards = resolveFlashCards(script);
    const flashFilterParts = [];
    const flashLabels = [];
    let flashTotal = 0;
    for (let i = 0; i < flashCards.length; i++) {
      const card = flashCards[i];
      const fontsize = fontSizeFor(card.text, videoWidth) * 1.15; // punchier than in-video captions
      const wrapped = wrapText(card.text, fontsize, videoWidth);
      const textFilePath = path.join(workDir, `flash-${i}.txt`);
      await fsp.writeFile(textFilePath, wrapped, 'utf8');

      flashFilterParts.push(
        `color=c=black:s=${videoWidth}x${videoHeight}:r=24:d=${card.duration}[flashbg${i}];` +
        `[flashbg${i}]format=yuv420p,drawtext=fontfile='${escapeForFilter(FONT_PATH)}'` +
        `:textfile='${escapeForFilter(textFilePath)}'` +
        `:fontcolor=white:fontsize=${Math.round(fontsize)}:line_spacing=10` +
        `:x=(w-text_w)/2:y=(h-text_h)/2[flashv${i}];`
      );
      flashLabels.push(`[flashv${i}]`);
      flashTotal += card.duration;
    }

    const totalDuration = flashTotal + duration;
    const filterComplex =
      flashFilterParts.join('') +
      `[0:v]format=yuv420p,${drawtextFilters.join(',')}[mainv];` +
      `${flashLabels.join('')}[mainv]concat=n=${flashCards.length + 1}:v=1:a=0[vout];` +
      `[1:a]atrim=0:${totalDuration.toFixed(2)},afade=t=in:st=0:d=0.5,` +
      `afade=t=out:st=${Math.max(0, totalDuration - 0.5).toFixed(2)}:d=0.5,volume=0.9[aout]`;

    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', clipPath,
      '-i', track.path,
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-map', '[aout]',
      '-t', totalDuration.toFixed(2),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-shortest',
      outputPath,
    ]);

    const outputBuffer = await fsp.readFile(outputPath);
    const blobName = `reels/${crypto.randomUUID()}.mp4`;
    const blob = await put(blobName, outputBuffer, {
      access: 'public',
      contentType: 'video/mp4',
      addRandomSuffix: false,
    });

    return { outputBlobUrl: blob.url, musicKey: track.key, ctaMode, duration: totalDuration, segments, flashCards, bytes: outputBuffer.length };
  } finally {
    await fsp.rm(workDir, { recursive: true, force: true });
  }
}

async function ensureAssembliesTable() {
  // Belt-and-suspenders: migrations/003 already creates this, but a fresh
  // environment that skipped the migration step shouldn't silently drop
  // ledger writes.
  await sql`
    CREATE TABLE IF NOT EXISTS reel_assemblies (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      source_blob_url TEXT NOT NULL,
      script JSONB NOT NULL,
      music_key TEXT NOT NULL,
      output_blob_url TEXT,
      status TEXT NOT NULL,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function recordAssembly({ sourceBlobUrl, script, musicKey, outputBlobUrl, status, error }) {
  await ensureAssembliesTable();
  const { rows } = await sql`
    INSERT INTO reel_assemblies
      (source_blob_url, script, music_key, output_blob_url, status, error, updated_at)
    VALUES
      (${sourceBlobUrl}, ${JSON.stringify(script)}::jsonb, ${musicKey}, ${outputBlobUrl ?? null}, ${status}, ${error ?? null}, NOW())
    RETURNING id
  `;
  return rows[0].id;
}

module.exports = {
  MUSIC_LIBRARY,
  DEFAULT_MUSIC_KEY,
  getMusicTrack,
  computeSegments,
  assembleReel,
  ensureAssembliesTable,
  recordAssembly,
};
