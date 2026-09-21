// api/gift-purchase.js
// Creates a Stripe PaymentIntent for a gift package purchase.
// Frontend confirms with Stripe Elements, then calls /api/gift-confirm.

const { GIFT_PACKAGES, getStripeSecretKey } = require('./_db');
const { calculateTax } = require('./_tax');

async function getStripe() {
  const key = await getStripeSecretKey();
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return require('stripe')(key);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { packageSlug, gifterName, gifterEmail, recipientEmail, zip } = req.body || {};

  if (!packageSlug) return res.status(400).json({ error: 'packageSlug is required' });

  const pkg = GIFT_PACKAGES[packageSlug];
  if (!pkg) return res.status(400).json({ error: `Unknown package: ${packageSlug}` });

  if (!gifterName) return res.status(400).json({ error: 'gifterName is required' });

  try {
    const stripe = await getStripe();
    // Unlike the call flow, there's no saved PaymentMethod to fall back on
    // yet — this is the first and only PaymentIntent for a gift purchase,
    // and per the task's own requirement (tax must be baked into the
    // charged amount, not added after the fact) the ZIP has to arrive in
    // this same request, before Stripe confirmation. gift.html now sends
    // it here in addition to attaching it to billing_details at confirm
    // time, so it's on the PaymentMethod too for consistency/refund lookups.
    const tax = await calculateTax(stripe, pkg.priceCents, zip, `gift-${packageSlug}`);

    const pi = await stripe.paymentIntents.create({
      amount:        tax.totalCents,
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
        ...tax.metadata,
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
