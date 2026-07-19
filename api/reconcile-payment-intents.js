// api/reconcile-payment-intents.js
// Vercel Cron safety net (see vercel.json) — cancels stray Stripe auth holds left
// behind by calls that never resolved through call-ended.js at all (e.g. a call
// that failed before Vapi ever fired a webhook for it). Complements the early
// release in call-ended.js rather than replacing it — this is the backstop for
// failure modes call-ended.js's webhook handling doesn't anticipate.
// Protected by CRON_SECRET, which Vercel sends as a Bearer token on cron-triggered
// invocations.

const { getStripeSecretKey } = require('./_db');

// Max call length is 2400s (40 min); 45 min gives a safe buffer past that before
// treating an open hold as abandoned.
const STALE_THRESHOLD_SECONDS = 45 * 60;

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const key = await getStripeSecretKey();
  if (!key) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });
  const stripe = require('stripe')(key);

  const cutoff = Math.floor(Date.now() / 1000) - STALE_THRESHOLD_SECONDS;
  const canceled = [];
  const errors = [];

  try {
    const results = await stripe.paymentIntents.search({
      query: `status:"requires_capture" AND created<${cutoff}`,
      limit: 100,
    });

    for (const pi of results.data) {
      try {
        await stripe.paymentIntents.cancel(pi.id);
        canceled.push(pi.id);
        console.log(`Reconcile: cancelled stale auth hold ${pi.id} (created ${new Date(pi.created * 1000).toISOString()})`);
      } catch (err) {
        errors.push({ id: pi.id, error: err.message });
        console.error(`Reconcile: failed to cancel ${pi.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Reconcile: search error:', err.message);
    return res.status(500).json({ error: err.message });
  }

  return res.status(200).json({ ok: true, checked: canceled.length + errors.length, canceled, errors });
};
