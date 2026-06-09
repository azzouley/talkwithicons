// api/create-payment-intent.js
// Step 1 of the payment flow — called by the frontend before the call starts.
// Creates a Stripe Customer and a $1 manual-capture authorization hold.
// The frontend confirms the hold with Stripe.js; on success it sends
// paymentIntentId + stripeCustomerId to start-call-basic (or start-call for Evangeline).
// At call end, call-ended.js cancels this hold and creates the final charge.

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, phoneNumber, character } = req.body || {};
  if (!firstName || !phoneNumber || !character) {
    return res.status(400).json({ error: 'firstName, phoneNumber, and character are required' });
  }

  try {
    const stripe = getStripe();

    // Customer is required so the saved PM can be charged off-session at call end
    const customer = await stripe.customers.create({
      name: firstName,
      phone: phoneNumber,
      metadata: { character, phoneNumber },
    });

    // $1 auth hold — captured only if the call is paid; cancelled for free calls.
    // setup_future_usage: 'off_session' saves the PM to the Customer after confirmation
    // so call-ended.js can charge the correct amount without user interaction.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      customer: customer.id,
      capture_method: 'manual',
      setup_future_usage: 'off_session',
      description: `TalkWithIcons — ${character} call auth`,
      metadata: { firstName, phoneNumber, character },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeCustomerId: customer.id,
    });
  } catch (err) {
    console.error('create-payment-intent error:', err.message);
    return res.status(500).json({ error: 'Payment setup failed', detail: err.message });
  }
};
