// api/grand-tour-purchase.js
// Creates a $79 Stripe PaymentIntent for the Grand Tour package.
// Frontend confirms with Stripe Elements, then calls /api/grand-tour-confirm.

const { GRAND_TOUR_PRICE_CENTS } = require('./_db');

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

  const { firstName, phoneNumber, email } = req.body || {};
  if (!firstName || !phoneNumber) {
    return res.status(400).json({ error: 'firstName and phoneNumber are required' });
  }

  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.create({
      amount:               GRAND_TOUR_PRICE_CENTS,
      currency:             'usd',
      description:          'TalkWithIcons — Grand Tour (100 min, all characters)',
      receipt_email:        email || undefined,
      metadata: {
        product:       'grand_tour',
        purchaserName:  firstName,
        purchaserPhone: phoneNumber,
        purchaserEmail: email || '',
      },
    });

    return res.status(200).json({
      clientSecret:    pi.client_secret,
      paymentIntentId: pi.id,
    });
  } catch (err) {
    console.error('grand-tour-purchase error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
