// api/grand-tour-confirm.js
// Called by frontend after Stripe Elements confirms Grand Tour payment.
// Verifies the charge succeeded, issues an access code, writes DB, sends email.
// Idempotent: a second call with the same paymentIntentId returns the existing code.

const nodemailer = require('nodemailer');
const {
  sql,
  generateAccessCode,
  updateDonationLedger,
  normalizePhone,
  GRAND_TOUR_MINUTES,
  GRAND_TOUR_DONATION_CENTS,
} = require('./_db');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

async function sendCodeEmail(email, firstName, accessCode) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  await transporter.sendMail({
    from:    `"TalkWithIcons" <${process.env.GMAIL_USER}>`,
    to:      email,
    subject: 'Your Grand Tour Access Code',
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <h2 style="font-size:22px;margin-bottom:8px">Your Grand Tour Access Code</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for your Grand Tour purchase. Your access code is below — keep it safe.
           It works across 100 minutes with any of our characters, any time.</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:4px;
                    background:#f5f0e8;padding:16px 24px;border-radius:8px;
                    text-align:center;margin:24px 0">${accessCode}</div>
        <p>When you're ready to call, enter this code on the character page before dialing.
           Each call deducts from your 100-minute balance. Calls under 6 minutes
           are not deducted.</p>
        <p style="font-size:13px;color:#666">
          Your purchase also donated to rescue dogs in your region — thank you.<br>
          Questions? Reply to this email.
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

  const { paymentIntentId, firstName, phoneNumber, email } = req.body || {};
  if (!paymentIntentId || !firstName || !phoneNumber) {
    return res.status(400).json({ error: 'paymentIntentId, firstName, and phoneNumber are required' });
  }

  const phone = normalizePhone(phoneNumber);

  // ── Idempotency check ─────────────────────────────────────────────────────────
  try {
    const existing = await sql`
      SELECT access_code, minutes_remaining FROM grand_tour_balances
      WHERE stripe_payment_id = ${paymentIntentId}
    `;
    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return res.status(200).json({
        accessCode:       row.access_code,
        minutesRemaining: row.minutes_remaining,
        alreadyIssued:    true,
      });
    }
  } catch (dbErr) {
    console.error('grand-tour-confirm idempotency check failed:', dbErr.message);
    return res.status(500).json({ error: 'Database error during idempotency check' });
  }

  // ── Verify Stripe payment succeeded ──────────────────────────────────────────
  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return res.status(402).json({
        error:  'Payment has not succeeded',
        status: pi.status,
      });
    }
  } catch (stripeErr) {
    console.error('grand-tour-confirm Stripe error:', stripeErr.message);
    return res.status(502).json({ error: 'Payment verification failed' });
  }

  // ── Generate code and write to DB ─────────────────────────────────────────────
  const accessCode = generateAccessCode();

  try {
    await sql`
      INSERT INTO grand_tour_balances
        (access_code, purchaser_phone, purchaser_name, purchaser_email,
         stripe_payment_id, minutes_total, minutes_remaining)
      VALUES
        (${accessCode}, ${phone}, ${firstName}, ${email || null},
         ${paymentIntentId}, ${GRAND_TOUR_MINUTES}, ${GRAND_TOUR_MINUTES})
    `;
  } catch (dbErr) {
    console.error('grand-tour-confirm DB insert error:', dbErr.message);
    return res.status(500).json({ error: 'Failed to record access code' });
  }

  // ── Donation ledger (non-blocking) ────────────────────────────────────────────
  updateDonationLedger(GRAND_TOUR_DONATION_CENTS).catch(err =>
    console.error('grand-tour-confirm donation ledger error:', err.message)
  );

  // ── Email code (non-blocking) ─────────────────────────────────────────────────
  if (email) {
    sendCodeEmail(email, firstName, accessCode).catch(err =>
      console.error('grand-tour-confirm email error:', err.message)
    );
  }

  return res.status(200).json({
    accessCode,
    minutesRemaining: GRAND_TOUR_MINUTES,
  });
};
