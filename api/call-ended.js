// Vapi webhook receiver.
// Register this URL in the Vapi dashboard under Assistant → Server URL (or Organization Server URL).
// Fires on every call event; only acts on end-of-call-report.
// Skips calls under 60 s (hangups / test dials).
// Schedules /api/send-followup via QStash with a 30-minute delay.

const https = require('https');

const ASSISTANT_NAMES = {
  'b98cec95-47a4-455d-92c8-3a08aacb556d': 'Albert Einstein',
  'bca7797f-d4c5-4b67-b22c-7506a0b045b9': 'Nostradamus',
  '3a6a8107-3faf-4cdd-a67b-5f71023c027d': 'Mark Twain',
  '099b6a90-1fa9-4e6a-bc4d-8c127c6b1141': 'Bruce Lee',
  'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6': 'Sherlock Holmes',
  '9647119e-7cf6-4d22-968d-25f3f455a834': 'Aela',
  '0560582f-8258-4803-8f2b-78b364fa23ca': 'Elizabeth Bennet',
  '2f0047c1-eeb7-412d-b455-f8f731bdd232': 'James Baldwin',
  '7fd88fa7-f013-4693-9b52-ab8937e4225d': 'Evangeline Adams',
};

const SITE_URL = process.env.SITE_URL || 'https://talkwithicons.vercel.app';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end();

  const msg = req.body?.message;

  // Vapi sends many event types — only process end-of-call-report
  if (!msg || msg.type !== 'end-of-call-report') {
    return res.status(200).json({ ok: true });
  }

  const call            = msg.call || {};
  const callerPhone     = call.customer?.number;
  const callerName      = call.customer?.name  || '';
  const callerEmail     = call.customer?.email || null;
  const assistantId     = call.assistantId;
  const characterName   = ASSISTANT_NAMES[assistantId] || 'one of our icons';
  const durationSeconds = Math.round(
    msg.durationSeconds ||
    call.durationSeconds ||
    (call.startedAt && call.endedAt
      ? (new Date(call.endedAt) - new Date(call.startedAt)) / 1000
      : 0)
  );
  const transcript = (msg.transcript || '').slice(0, 3000);

  // Skip very short calls — likely test dials or immediate hangups
  if (!callerPhone || durationSeconds < 60) {
    return res.status(200).json({ ok: true, skipped: 'too short or no phone' });
  }

  // Schedule the follow-up via QStash
  const qstashBase  = (process.env.QSTASH_URL || 'https://qstash.upstash.io').replace(/\/$/, '');
  const qstashToken = process.env.QSTASH_TOKEN;

  if (!qstashToken) {
    console.error('QSTASH_TOKEN not set');
    return res.status(200).json({ ok: true, warning: 'QStash not configured' });
  }

  const destination = encodeURIComponent(SITE_URL + '/api/send-followup');
  const qstashHost  = new URL(qstashBase).hostname;
  const publishPath = '/v2/publish/' + destination;

  const payload = JSON.stringify({
    callerPhone,
    callerName,
    callerEmail,
    characterName,
    durationSeconds,
    transcript,
  });

  await new Promise((resolve, reject) => {
    const opts = {
      hostname: qstashHost,
      path:     publishPath,
      method:   'POST',
      headers:  {
        'Authorization':  'Bearer ' + qstashToken,
        'Content-Type':   'application/json',
        'Upstash-Delay':  '1800s',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const r = https.request(opts, res2 => {
      let d = '';
      res2.on('data', c => d += c);
      res2.on('end', () => {
        console.log('QStash queued follow-up:', res2.statusCode, callerPhone, characterName);
        resolve();
      });
    });
    r.on('error', err => {
      console.error('QStash publish error:', err.message);
      resolve(); // Don't fail the webhook response over a scheduling error
    });
    r.write(payload);
    r.end();
  });

  return res.status(200).json({ ok: true, followUpScheduled: true });
};
