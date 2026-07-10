// api/gift-confirm.js
// Called by frontend after Stripe confirms gift payment.
// Verifies payment succeeded, generates access code, writes DB, emails gifter + recipient.
// Idempotent: second call with same paymentIntentId returns the existing code.

const {
  sql,
  generateAccessCode,
  updateDonationLedger,
  GIFT_PACKAGES,
  GIFT_DONATION_CENTS,
  getStripeSecretKey,
} = require('./_db');

async function getStripe() {
  const key = await getStripeSecretKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return null;
  const nodemailer = require('nodemailer');
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
}

const CHARACTER_DISPLAY = {
  einstein:   'Albert Einstein',
  holmes:     'Sherlock Holmes',
  evangeline: 'Evangeline Adams',
  aela:       'Aela',
};

async function sendGifterEmail(gifterEmail, gifterName, pkg, accessCode, recipientEmail) {
  const transporter = createTransporter();
  if (!transporter) return;

  const siteUrl    = process.env.SITE_URL || 'https://talkwithicons.vercel.app';
  const redeemNote = pkg.character
    ? `The recipient enters this code on the ${CHARACTER_DISPLAY[pkg.character] || pkg.character} page at TalkWithIcons.`
    : `The recipient goes to TalkWithIcons, picks any icon they'd like to speak with, and enters this code. No card needed.`;

  await transporter.sendMail({
    from:    `"TalkWithIcons" <${process.env.GMAIL_USER}>`,
    to:      gifterEmail,
    subject: `Your gift is ready — ${pkg.label}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <h2 style="font-size:22px;margin-bottom:8px">${pkg.label}</h2>
        <p>Hi ${gifterName},</p>
        <p>Your gift is ready.${recipientEmail ? ` We've also sent a copy directly to ${recipientEmail}.` : ''}</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:4px;
                    background:#f5f0e8;padding:16px 24px;border-radius:8px;
                    text-align:center;margin:24px 0">${accessCode}</div>
        <p><strong>${pkg.description}.</strong><br>
        ${redeemNote}
        The code expires in 90 days.</p>
        <p style="font-size:13px;color:#666">
          Your purchase included a $0.50 donation to rescue dogs — thank you.<br>
          Questions? Reply to this email.
        </p>
      </div>
    `,
  });
}

async function sendRecipientEmail(recipientEmail, gifterName, pkg, accessCode) {
  const transporter = createTransporter();
  if (!transporter) return;

  const siteUrl = process.env.SITE_URL || 'https://talkwithicons.vercel.app';
  const step1   = pkg.character
    ? `Go to <a href="${siteUrl}/${pkg.character}.html">${CHARACTER_DISPLAY[pkg.character] || pkg.character} on TalkWithIcons</a>`
    : `Go to <a href="${siteUrl}">TalkWithIcons</a> and pick any icon you'd like to speak with`;

  await transporter.sendMail({
    from:    `"TalkWithIcons" <${process.env.GMAIL_USER}>`,
    to:      recipientEmail,
    subject: `${gifterName} sent you a call — ${pkg.label}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <h2 style="font-size:22px;margin-bottom:8px">You have a gift.</h2>
        <p>${gifterName} gifted you ${pkg.description}.</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:4px;
                    background:#f5f0e8;padding:16px 24px;border-radius:8px;
                    text-align:center;margin:24px 0">${accessCode}</div>
        <p><strong>How to use it:</strong></p>
        <ol style="padding-left:20px;line-height:1.8">
          <li>${step1}</li>
          <li>Enter your name and phone number</li>
          <li>Click "Have a gift code?" and enter the code above</li>
          <li>Click Call — no card needed</li>
        </ol>
        <p style="font-size:13px;color:#666;margin-top:16px">
          This code expires in 90 days and is good for one conversation.<br>
          The first time you use it, it locks to your phone number.
        </p>
      </div>
    `,
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { paymentIntentId, packageSlug, gifterName, gifterEmail, recipientEmail } = req.body || {};

  if (!paymentIntentId || !packageSlug || !gifterName) {
    return res.status(400).json({ error: 'paymentIntentId, packageSlug, and gifterName are required' });
  }

  const pkg = GIFT_PACKAGES[packageSlug];
  if (!pkg) return res.status(400).json({ error: `Unknown package: ${packageSlug}` });

  // ── Idempotency check ─────────────────────────────────────────────────────────
  try {
    const existing = await sql`
      SELECT access_code FROM gift_balances WHERE stripe_payment_id = ${paymentIntentId}
    `;
    if (existing.rows.length > 0) {
      return res.status(200).json({ accessCode: existing.rows[0].access_code, alreadyIssued: true });
    }
  } catch (dbErr) {
    console.error('gift-confirm idempotency check failed:', dbErr.message);
    return res.status(500).json({ error: 'Database error during idempotency check' });
  }

  // ── Verify Stripe payment succeeded ──────────────────────────────────────────
  try {
    const stripe = await getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return res.status(402).json({ error: 'Payment has not succeeded', status: pi.status });
    }
  } catch (stripeErr) {
    console.error('gift-confirm Stripe error:', stripeErr.message);
    return res.status(502).json({ error: 'Payment verification failed' });
  }

  // ── Generate code and write to DB ─────────────────────────────────────────────
  const accessCode = generateAccessCode();
  const expiresAt  = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  try {
    await sql`
      INSERT INTO gift_balances
        (access_code, package_slug, character_key, minutes_total, minutes_remaining,
         gifter_name, gifter_email, recipient_email, stripe_payment_id, expires_at)
      VALUES
        (${accessCode}, ${packageSlug}, ${pkg.character}, ${pkg.minutesTotal}, ${pkg.minutesTotal},
         ${gifterName}, ${gifterEmail || null}, ${recipientEmail || null},
         ${paymentIntentId}, ${expiresAt.toISOString()})
    `;
  } catch (dbErr) {
    console.error('gift-confirm DB insert error:', dbErr.message);
    return res.status(500).json({ error: 'Failed to record access code' });
  }

  // ── Donation ledger (non-blocking) ────────────────────────────────────────────
  updateDonationLedger(GIFT_DONATION_CENTS).catch(err =>
    console.error('gift-confirm donation ledger error:', err.message)
  );

  // ── Email gifter (non-blocking) ───────────────────────────────────────────────
  if (gifterEmail) {
    sendGifterEmail(gifterEmail, gifterName, pkg, accessCode, recipientEmail).catch(err =>
      console.error('gift-confirm gifter email error:', err.message)
    );
  }

  // ── Email recipient (non-blocking) ────────────────────────────────────────────
  if (recipientEmail) {
    sendRecipientEmail(recipientEmail, gifterName, pkg, accessCode).catch(err =>
      console.error('gift-confirm recipient email error:', err.message)
    );
  }

  return res.status(200).json({ accessCode });
};
