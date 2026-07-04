// api/gift-purchase.js
// Creates a Stripe PaymentIntent for a gift package purchase.
// Frontend confirms with Stripe Elements, then calls /api/gift-confirm.

const { GIFT_PACKAGES } = require('./_db');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { packageSlug, gifterName, gifterEmail, recipientEmail } = req.body || {};

  if (!packageSlug) return res.status(400).json({ error: 'packageSlug is required' });

  const pkg = GIFT_PACKAGES[packageSlug];
  if (!pkg) return res.status(400).json({ error: `Unknown package: ${packageSlug}` });

  if (!gifterName) return res.status(400).json({ error: 'gifterName is required' });

  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.create({
      amount:        pkg.priceCents,
      currency:      'usd',
      description:   `TalkWithIcons Gift — ${pkg.label}`,
      receipt_email: gifterEmail || undefined,
      metadata: {
        product:        'gift',
        packageSlug,
        characterKey:   pkg.character,
        gifterName,
        gifterEmail:    gifterEmail    || '',
        recipientEmail: recipientEmail || '',
      },
    });

    return res.status(200).json({
      clientSecret:    pi.client_secret,
      paymentIntentId: pi.id,
    });
  } catch (err) {
    console.error('gift-purchase error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
