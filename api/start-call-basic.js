// api/start-call-basic.js
// Outbound call trigger for all non-Evangeline characters.
// Payment flow: frontend confirms a $1 Stripe auth hold via create-payment-intent,
// then sends paymentIntentId + stripeCustomerId here. This endpoint verifies the hold
// is confirmed (requires_capture) before triggering the Vapi call, and stores the
// payment identifiers in Vapi call metadata so call-ended.js can bill correctly.

const { sql, getStripeSecretKey } = require('./_db');

// ── Shared Vapi credentials ───────────────────────────────────────────────────
const VAPI_API_KEY             = process.env.VAPI_API_KEY             || 'YOUR_VAPI_API_KEY';
const VAPI_PHONE_NUMBER_ID_DEFAULT = process.env.VAPI_PHONE_NUMBER_ID || 'YOUR_VAPI_PHONE_NUMBER_ID';

// ── Per-character Vapi assistant IDs ─────────────────────────────────────────
const ASSISTANT_IDS = {
  einstein:    process.env.VAPI_ASSISTANT_ID_EINSTEIN    || 'YOUR_EINSTEIN_ASSISTANT_ID',
  nostradamus: process.env.VAPI_ASSISTANT_ID_NOSTRADAMUS || 'YOUR_NOSTRADAMUS_ASSISTANT_ID',
brucelee:    process.env.VAPI_ASSISTANT_ID_BRUCE_LEE    || 'YOUR_BRUCE_LEE_ASSISTANT_ID',
  holmes:      process.env.VAPI_ASSISTANT_ID_HOLMES      || 'YOUR_HOLMES_ASSISTANT_ID',
  aela:        process.env.VAPI_ASSISTANT_ID_AELA        || 'YOUR_AELA_ASSISTANT_ID',
  bennet:      process.env.VAPI_ASSISTANT_ID_BENNET      || 'YOUR_BENNET_ASSISTANT_ID',
  baldwin:     process.env.VAPI_ASSISTANT_ID_BALDWIN     || 'YOUR_BALDWIN_ASSISTANT_ID',
  davinci:     process.env.VAPI_ASSISTANT_ID_DAVINCI     || 'YOUR_DAVINCI_ASSISTANT_ID',
  houdini:       process.env.VAPI_ASSISTANT_ID_HOUDINI        || 'YOUR_HOUDINI_ASSISTANT_ID',
  frankenstein:  process.env.VAPI_ASSISTANT_ID_FRANKENSTEIN   || 'YOUR_FRANKENSTEIN_ASSISTANT_ID',
  sittingbull:   process.env.VAPI_ASSISTANT_ID_SITTINGBULL    || 'YOUR_SITTING_BULL_ASSISTANT_ID',
};

// ── Per-character phone number IDs (fall back to shared if not set) ───────────
const PHONE_NUMBER_IDS = {
  einstein:    process.env.VAPI_PHONE_NUMBER_ID_EINSTEIN    || VAPI_PHONE_NUMBER_ID_DEFAULT,
  nostradamus: process.env.VAPI_PHONE_NUMBER_ID_NOSTRADAMUS || VAPI_PHONE_NUMBER_ID_DEFAULT,
brucelee:    process.env.VAPI_PHONE_NUMBER_ID_BRUCE_LEE    || VAPI_PHONE_NUMBER_ID_DEFAULT,
  holmes:      process.env.VAPI_PHONE_NUMBER_ID_HOLMES      || VAPI_PHONE_NUMBER_ID_DEFAULT,
  aela:        process.env.VAPI_PHONE_NUMBER_ID_AELA        || VAPI_PHONE_NUMBER_ID_DEFAULT,
  bennet:      process.env.VAPI_PHONE_NUMBER_ID_BENNET      || VAPI_PHONE_NUMBER_ID_DEFAULT,
  baldwin:     process.env.VAPI_PHONE_NUMBER_ID_BALDWIN     || VAPI_PHONE_NUMBER_ID_DEFAULT,
  davinci:     process.env.VAPI_PHONE_NUMBER_ID_DAVINCI     || VAPI_PHONE_NUMBER_ID_DEFAULT,
  houdini:       process.env.VAPI_PHONE_NUMBER_ID_HOUDINI       || VAPI_PHONE_NUMBER_ID_DEFAULT,
  frankenstein:  process.env.VAPI_PHONE_NUMBER_ID_FRANKENSTEIN  || VAPI_PHONE_NUMBER_ID_DEFAULT,
  sittingbull:   process.env.VAPI_PHONE_NUMBER_ID_SITTINGBULL   || VAPI_PHONE_NUMBER_ID_DEFAULT,
};

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits;
}

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName: firstNameRaw, phoneNumber, character, language, paymentIntentId, stripeCustomerId, tourCode, giftCode } = req.body || {};
  const firstName = (firstNameRaw || '').trim();
  if (!firstName || !phoneNumber || !character) {
    return res.status(400).json({ error: 'firstName, phoneNumber, and character are required' });
  }
  const lang = (language === 'es') ? 'es' : 'en';

  const assistantId = ASSISTANT_IDS[character.toLowerCase()];
  if (!assistantId || assistantId.startsWith('YOUR_')) {
    return res.status(400).json({ error: `Character "${character}" is not yet configured` });
  }

  // ── Grand Tour path (bypasses Stripe entirely) ────────────────────────────────
  if (tourCode) {
    const code  = tourCode.trim().toUpperCase();
    const phone = normalizePhone(phoneNumber);
    try {
      const result = await sql`
        SELECT purchaser_phone, minutes_remaining
        FROM grand_tour_balances
        WHERE access_code = ${code}
      `;
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Grand Tour code not found' });
      }
      const row = result.rows[0];
      if (row.purchaser_phone && row.purchaser_phone !== phone) {
        return res.status(403).json({ error: 'Phone number does not match this Grand Tour code' });
      }
      if (row.minutes_remaining < 5) {
        return res.status(403).json({
          error:            'Insufficient minutes remaining',
          minutesRemaining: row.minutes_remaining,
        });
      }
    } catch (dbErr) {
      console.error('Grand Tour validation error:', dbErr.message);
      return res.status(500).json({ error: 'Grand Tour validation failed' });
    }

    const vapiPayload = {
      phoneNumberId: PHONE_NUMBER_IDS[character.toLowerCase()],
      customer:      { number: normalizePhone(phoneNumber), name: firstName },
      assistantId,
      assistantOverrides: {
        variableValues: { callerName: firstName, language: lang },
      },
      metadata: { tourCode: code, language: lang },
    };

    console.log('start-call-basic [Grand Tour]:', character, '| callerName:', firstName, '| code:', code);
    try {
      const vapiRes  = await fetch('https://api.vapi.ai/call', {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vapiPayload),
      });
      const vapiData = await vapiRes.json();
      if (!vapiRes.ok) {
        console.error('Vapi error:', vapiData);
        return res.status(502).json({ error: 'Call service error', detail: vapiData });
      }
      return res.status(200).json({ success: true, callId: vapiData.id });
    } catch (err) {
      console.error('start-call-basic [Grand Tour] error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── Gift code path (bypasses Stripe entirely) ─────────────────────────────────
  if (giftCode) {
    const code  = giftCode.trim().toUpperCase();
    const phone = normalizePhone(phoneNumber);
    try {
      const result = await sql`
        SELECT access_code, character_key, phone_locked_to, minutes_remaining, expires_at
        FROM gift_balances WHERE access_code = ${code}
      `;
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Gift code not found' });
      }
      const row = result.rows[0];
      if (row.character_key !== character.toLowerCase()) {
        return res.status(403).json({ error: 'This gift code is not valid for this character' });
      }
      if (new Date(row.expires_at) < new Date()) {
        return res.status(403).json({ error: 'This gift code has expired' });
      }
      if (row.phone_locked_to && row.phone_locked_to !== phone) {
        return res.status(403).json({ error: 'Phone number does not match this gift code' });
      }
      if (row.minutes_remaining < 5) {
        return res.status(403).json({
          error:            'Insufficient minutes remaining on this gift code',
          minutesRemaining: row.minutes_remaining,
        });
      }
      // Lock to phone on first use
      if (!row.phone_locked_to) {
        await sql`
          UPDATE gift_balances
          SET phone_locked_to = ${phone}, updated_at = NOW()
          WHERE access_code = ${code}
        `;
      }
    } catch (dbErr) {
      console.error('Gift code validation error:', dbErr.message);
      return res.status(500).json({ error: 'Gift code validation failed' });
    }

    const vapiPayload = {
      phoneNumberId: PHONE_NUMBER_IDS[character.toLowerCase()],
      customer:      { number: normalizePhone(phoneNumber), name: firstName },
      assistantId,
      assistantOverrides: {
        variableValues: { callerName: firstName, language: lang },
      },
      metadata: { giftCode: code, language: lang },
    };

    console.log('start-call-basic [Gift]:', character, '| callerName:', firstName, '| code:', code);
    try {
      const vapiRes  = await fetch('https://api.vapi.ai/call', {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vapiPayload),
      });
      const vapiData = await vapiRes.json();
      if (!vapiRes.ok) {
        console.error('Vapi error:', vapiData);
        return res.status(502).json({ error: 'Call service error', detail: vapiData });
      }
      return res.status(200).json({ success: true, callId: vapiData.id });
    } catch (err) {
      console.error('start-call-basic [Gift] error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── Stripe auth hold verification ────────────────────────────────────────────
  // paymentIntentId is required once STRIPE_SECRET_KEY is live.
  // During development (key not set), the check is skipped so calls still work.
  let paymentMethodId = null;

  const activeStripeKey = await getStripeSecretKey();
  if (activeStripeKey) {
    if (!paymentIntentId) {
      return res.status(402).json({ error: 'Payment authorization required' });
    }
    try {
      const stripe = await getStripe();
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (pi.status !== 'requires_capture') {
        return res.status(402).json({
          error: 'Payment authorization not confirmed',
          status: pi.status,
        });
      }

      paymentMethodId = typeof pi.payment_method === 'string'
        ? pi.payment_method
        : pi.payment_method?.id || null;
    } catch (err) {
      console.error('Stripe PI verification error:', err.message);
      return res.status(502).json({ error: 'Payment verification failed', detail: err.message });
    }
  }

  // ── Build Vapi call payload ───────────────────────────────────────────────────
  const vapiPayload = {
    phoneNumberId: PHONE_NUMBER_IDS[character.toLowerCase()],
    customer:      { number: normalizePhone(phoneNumber), name: firstName },
    assistantId,
    assistantOverrides: {
      variableValues: { callerName: firstName, language: lang },
    },
    // Payment identifiers stored in metadata so call-ended.js can bill correctly
    metadata: paymentIntentId ? {
      paymentIntentId,
      paymentMethodId:   paymentMethodId || '',
      stripeCustomerId:  stripeCustomerId || '',
      language:          lang,
    } : { language: lang },
  };

  console.log('start-call-basic:', character, '| callerName:', firstName, '| lang:', lang);
  try {
    const vapiRes  = await fetch('https://api.vapi.ai/call', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vapiPayload),
    });
    const vapiData = await vapiRes.json();

    if (!vapiRes.ok) {
      console.error('Vapi error:', vapiData);
      return res.status(502).json({ error: 'Call service error', detail: vapiData });
    }

    return res.status(200).json({ success: true, callId: vapiData.id });
  } catch (err) {
    console.error('start-call-basic error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
