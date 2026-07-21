// QStash delayed receiver — fires 30 minutes after a call ends.
// Verifies QStash signature, then sends email via Gmail.
//
// Required env vars:
//   QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY
//   GMAIL_USER, GMAIL_PASS  (Gmail app password — not your Google password)

const crypto = require('crypto');

// Disable Vercel body parser — need raw bytes for QStash signature verification
const handler = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Read raw body
  const rawBody = await new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', chunk => { buf += chunk; });
    req.on('end', () => resolve(buf));
    req.on('error', reject);
  });

  // Verify QStash signature (try current key, then next key for rotation)
  const sigHeader = req.headers['upstash-signature'] || '';
  const sigKeys   = [
    process.env.QSTASH_CURRENT_SIGNING_KEY,
    process.env.QSTASH_NEXT_SIGNING_KEY,
  ].filter(Boolean);

  if (sigKeys.length > 0 && !verifyQStash(rawBody, sigHeader, sigKeys)) {
    console.warn('QStash signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let data;
  try { data = JSON.parse(rawBody); }
  catch (_) { return res.status(400).json({ error: 'Invalid JSON' }); }

  const { callerName, callerEmail, characterName, durationSeconds } = data;

  const firstName = (callerName || '').split(' ')[0] || 'there';
  const minutes   = Math.round((durationSeconds || 0) / 60);
  const hook      = CHARACTER_HOOKS[characterName] || 'Every conversation on TalkWithIcons is one of a kind.';
  const site      = 'talkwithicons.vercel.app';

  const emailHtml = buildEmail(firstName, characterName, minutes, hook, site);

  const result = await sendEmail(
    callerEmail,
    `Your call with ${characterName} — TalkWithIcons`,
    emailHtml
  );

  console.log('follow-up email:', JSON.stringify(result));

  return res.status(200).json({ ok: true });
};

handler.config = { api: { bodyParser: false } };
module.exports = handler;

// =============================================================================

// QStash JWT signature verification (HS256)
function verifyQStash(rawBody, sigHeader, keys) {
  const parts = sigHeader.split('.');
  if (parts.length !== 3) return false;
  const [hdr, payload, sig] = parts;
  const message = hdr + '.' + payload;

  for (const key of keys) {
    const mac = crypto.createHmac('sha256', key)
      .update(message)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (mac !== sig) continue;

    try {
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      const bodyHash = crypto.createHash('sha256').update(rawBody).digest('base64');
      if (decoded.body === bodyHash) return true;
    } catch (_) {}
  }
  return false;
}

const CHARACTER_HOOKS = {
  'Nostradamus':             'What was said was written. What you do with it is not.',
  'Aela':                    'The signal was received. Trust what you heard.',
  'Evangeline Adams':        'The chart has been read. The transits are already in motion.',
  'Lee Harvey Oswald':       'Sixty years of being told to stay quiet. This is what it sounds like when someone finally lets you finish.',
  'Leonardo da Vinci':       'The question stays open — that is exactly how I would want to leave it.',
  'Zhou Han':                'What you tested tonight, keep testing. That is the only tradition worth keeping.',
  'Dr. John H. Watson':      'You have had more time than most of my readers ever got. Put it to good use.',
  'Father Elia Rocca':       'Restraint, not theater — same as always. Carry the real thing forward, not the performance.',
  'Céleste':                 'Two hundred and sixty years, and that still felt like something. Go carefully out there.',
  'Harry Houdini':           'I spent my life exposing the trick behind the wonder. Go find out which one this was.',
  "Frankenstein's Creature": 'You judged me by what I said, not by what you had heard about me. That is more than most ever gave me.',
  'Friday':                  'A story paused is not a story ended. This one is not, either.',
};

function buildEmail(firstName, characterName, minutes, hook, site) {
  const durationLine = minutes > 0
    ? `You spoke for ${minutes} minute${minutes === 1 ? '' : 's'}.`
    : '';
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0d0b08;font-family:Georgia,serif;color:#f5f0e8;">
<div style="max-width:560px;margin:40px auto;padding:0 24px;">

  <p style="font-size:0.68rem;letter-spacing:0.25em;text-transform:uppercase;color:#c9a84c;margin:0 0 12px;">
    TalkWithIcons
  </p>

  <h1 style="font-size:1.7rem;font-weight:700;line-height:1.15;margin:0 0 20px;color:#f5f0e8;">
    Your call with ${characterName}<br>has ended.
  </h1>

  <p style="font-size:0.95rem;color:#9a8f7a;line-height:1.75;margin:0 0 24px;">
    ${durationLine ? durationLine + ' ' : ''}Every call on TalkWithIcons is unrepeatable. That conversation existed once, between you and no one else. It is gone now — and entirely yours.
  </p>

  <blockquote style="border-left:3px solid #c9a84c;margin:0 0 28px;padding:4px 0 4px 20px;">
    <p style="font-style:italic;color:#d4c9b0;line-height:1.65;margin:0;">
      ${hook}
    </p>
  </blockquote>

  <p style="font-size:0.95rem;color:#9a8f7a;line-height:1.75;margin:0 0 32px;">
    When you're ready for another conversation — with ${characterName} again, or any of the eight other icons — the first two minutes are always free.
  </p>

  <a href="https://${site}"
     style="display:inline-block;font-family:'Courier New',monospace;font-size:0.78rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:#c9a84c;color:#0d0b08;padding:14px 32px;text-decoration:none;">
    Return to TalkWithIcons →
  </a>

  <hr style="border:none;border-top:1px solid rgba(201,168,76,0.15);margin:40px 0 20px;">

  <p style="font-size:0.7rem;color:rgba(154,143,122,0.5);line-height:1.6;margin:0;">
    Every paid call triggers at minimum a meal donation for a rescue dog. 🐾<br>
    © 2026 TalkWithIcons. You received this because you completed a call.
  </p>

</div>
</body>
</html>`;
}

async function sendEmail(to, subject, html) {
  if (!to) return { skipped: 'no email address' };
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) return { skipped: 'Gmail not configured' };

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return transporter.sendMail({
    from:    `TalkWithIcons <${user}>`,
    to,
    subject,
    html,
  });
}
