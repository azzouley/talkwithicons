// api/config.js
// Returns public configuration values the frontend needs.
// The Stripe publishable key is intentionally public — it is safe to expose.

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  return res.status(200).json({
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
  });
};
