// api/call-ended.js
// Vapi webhook receiver — fires on every call event; only acts on end-of-call-report.
// Handles Stripe billing — cancel auth hold (free calls) or charge correct amount (paid calls).
// Runs for ALL calls including short ones so the auth hold is never left dangling.

const { sql, calcPerCallDonationCents, updateDonationLedger, getStripeSecretKey } = require('./_db');
const { logCall } = require('./_log-call');

const ASSISTANT_NAMES = {
  'b98cec95-47a4-455d-92c8-3a08aacb556d': 'Long John Silver',
  'd8a4ad09-882c-41b1-a48f-ceceb3e5ee27': 'Father Elia Rocca', // retired 2026-07-20, broken assistant, replaced by bead497f
  'bead497f-38a2-4245-8a02-276ccaf9c5fa': 'Father Elia Rocca',
  'bca7797f-d4c5-4b67-b22c-7506a0b045b9': 'Nostradamus',
'099b6a90-1fa9-4e6a-bc4d-8c127c6b1141': 'Bruce Lee', // retired 2026-07-21, replaced by Zhou Han
  '0964cfaa-6059-4a55-b71f-1d8c74fe690f': 'Ching Shih',
  'b65fb3ab-df3c-4a5b-8a96-3e865d9315b6': 'Dr. John H. Watson',
  '9647119e-7cf6-4d22-968d-25f3f455a834': 'Aela',
  '0560582f-8258-4803-8f2b-78b364fa23ca': 'Céleste',
  '2f0047c1-eeb7-412d-b455-f8f731bdd232': 'Walter Hobbs',
  '7fd88fa7-f013-4693-9b52-ab8937e4225d': 'Evangeline Adams',
  'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0': 'Friday',
  '23ef91d2-fc8f-4fee-9c2e-25e93b51c331': 'Leonardo da Vinci',
  'ca384c56-f276-4940-b20b-1ae939bef23b': 'Harry Houdini',
  'f96bb0a5-6e8f-4153-8bee-6b76fa14f881': "Frankenstein's Creature", // retired 2026-07-31, replaced by ff48a258
  'ff48a258-0691-430a-a0ad-ada09b9022f9': 'Nikola Tesla',
  '101718d5-fc95-462c-8ca8-a966aefed7b4': 'Giacomo Casanova',
};

// ── Billing calculation ───────────────────────────────────────────────────────
// Minutes 1–2: free | Minutes 3–5: $3.99 gate | Minute 6+: $1.00/min
// Uses ceil(seconds/60) so a started minute is a billed minute.
function calcChargeAmountCents(durationSeconds) {
  const minutes = Math.ceil(durationSeconds / 60);
  if (minutes <= 2) return 0;
  if (minutes <= 5) return 399;
  return 399 + (minutes - 5) * 100;
}

// Cancels the $1 auth hold only if it's still open. Vapi can fire a
// status-update("ended") event for a call in addition to end-of-call-report,
// and the early-release handler above may have already canceled this same
// PaymentIntent by the time this runs — an unconditional .cancel() call would
// then throw "PaymentIntent ... has a status of canceled" and abort the whole
// billing block before the real charge ever ran. Check-then-cancel avoids that.
async function cancelHoldIfOpen(stripe, paymentIntentId) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status === 'requires_capture') {
    await stripe.paymentIntents.cancel(paymentIntentId);
  }
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
  if (req.method !== 'POST') return res.status(405).end();

  const msg = req.body?.message;

  if (!msg) {
    return res.status(200).json({ ok: true });
  }

  // ── Early auth-hold release ───────────────────────────────────────────────────
  // Safety net for calls that never connect (e.g. a Twilio provider auth failure —
  // see "call.start.error-get-transport"). Those calls end before Vapi ever fires
  // end-of-call-report, so the $1 hold created in create-payment-intent.js would
  // otherwise sit unresolved forever. Vapi always sends a status-update with
  // status "ended" when a call terminates, connected or not, so release the hold
  // here as soon as that arrives. Idempotent: only acts if the hold is still open,
  // so it can't conflict with the normal cancel/charge below if end-of-call-report
  // also arrives for the same call.
  if (msg.type === 'status-update' && msg.status === 'ended') {
    const earlyPaymentIntentId = msg.call?.metadata?.paymentIntentId;
    if (earlyPaymentIntentId) {
      try {
        const stripe = await getStripe();
        const pi = await stripe.paymentIntents.retrieve(earlyPaymentIntentId);
        if (pi.status === 'requires_capture') {
          await stripe.paymentIntents.cancel(earlyPaymentIntentId);
          console.log(`Stripe: call ended without ever billing — auth hold released early. PI=${earlyPaymentIntentId} endedReason=${msg.endedReason || 'unknown'}`);
        }
      } catch (err) {
        console.error('Early auth-hold release error:', err.message, { paymentIntentId: earlyPaymentIntentId });
      }
    }
    return res.status(200).json({ ok: true });
  }

  if (msg.type !== 'end-of-call-report') {
    return res.status(200).json({ ok: true });
  }

  const call            = msg.call || {};
  const callerPhone     = call.customer?.number;
  const callerName      = call.customer?.name  || '';
  const assistantId     = call.assistantId;
  const characterName   = ASSISTANT_NAMES[assistantId] || 'one of our icons';
  const durationSeconds = Math.round(
    msg.durationSeconds ||
    call.durationSeconds ||
    (call.startedAt && call.endedAt
      ? (new Date(call.endedAt) - new Date(call.startedAt)) / 1000
      : 0)
  );

  // ── Stripe billing ────────────────────────────────────────────────────────────
  // Runs for every call regardless of duration, so auth holds are always resolved.
  const paymentIntentId  = call.metadata?.paymentIntentId;
  const paymentMethodId  = call.metadata?.paymentMethodId;
  const stripeCustomerId = call.metadata?.stripeCustomerId;

  // Hoisted for calls/_log-call.js — set at whichever real outcome below actually
  // occurs, so a value always exists by the time logCall runs at the end of the
  // handler (they were previously trapped inside the try/else block's own scope).
  let converted    = false;
  let revenueCents = 0;
  let donationCentsLogged = 0;

  if (paymentIntentId) {
    try {
      const stripe       = await getStripe();
      const chargeAmount = calcChargeAmountCents(durationSeconds);
      const durationMins = Math.ceil(durationSeconds / 60);

      if (chargeAmount === 0) {
        // Free call — release the auth hold if still open. revenueCents stays 0:
        // correct, since no charge was ever attempted.
        await cancelHoldIfOpen(stripe, paymentIntentId);
        console.log(`Stripe: free call — auth hold cancelled. PI=${paymentIntentId} phone=${callerPhone}`);
      } else {
        // Paid call — release the $1 hold if still open, then create the final
        // charge regardless (the hold's cancel status doesn't block a new charge).
        await cancelHoldIfOpen(stripe, paymentIntentId);

        const charge = await stripe.paymentIntents.create({
          amount:         chargeAmount,
          currency:       'usd',
          customer:       stripeCustomerId || undefined,
          payment_method: paymentMethodId,
          confirm:        true,
          off_session:    true,
          description:    `TalkWithIcons — ${characterName} (${durationMins} min)`,
          metadata:       {
            callerPhone:   callerPhone || '',
            callerName,
            durationMins:  String(durationMins),
            character:     characterName,
          },
        });
        converted    = true;
        revenueCents = chargeAmount; // only counted as revenue once the charge actually succeeded

        console.log(
          `Stripe: charged $${(chargeAmount / 100).toFixed(2)} — ${charge.id}` +
          ` | ${durationMins} min | ${characterName} | ${callerPhone}`
        );

        const donationCents = calcPerCallDonationCents(durationSeconds);
        donationCentsLogged = donationCents;
        sql`
          INSERT INTO transactions
            (stripe_charge_id, stripe_payment_intent_id, caller_phone, caller_name,
             character_name, duration_seconds, charge_cents, donation_cents)
          VALUES
            (${charge.id}, ${paymentIntentId || ''}, ${callerPhone || ''}, ${callerName},
             ${characterName}, ${durationSeconds}, ${chargeAmount}, ${donationCents})
        `.catch(err => console.error('transactions insert error:', err.message));

        updateDonationLedger(donationCents).catch(err =>
          console.error('donation ledger update error:', err.message)
        );
      }
    } catch (stripeErr) {
      // Log but don't fail the webhook — the rest of the handler must still run
      console.error('Stripe billing error:', stripeErr.message, {
        paymentIntentId,
        chargeAmount: calcChargeAmountCents(durationSeconds),
        callerPhone,
      });
    }
  }

  // ── Gift code minute deduction ────────────────────────────────────────────────
  const giftCode = call.metadata?.giftCode;
  if (giftCode && durationSeconds > 0) {
    const giftMins = Math.ceil(durationSeconds / 60);
    if (giftMins > 4) {
      try {
        await sql`
          UPDATE gift_balances
          SET minutes_remaining = GREATEST(0, minutes_remaining - ${giftMins}),
              updated_at        = NOW()
          WHERE access_code = ${giftCode}
        `;
        const updated = await sql`
          SELECT minutes_remaining FROM gift_balances WHERE access_code = ${giftCode}
        `;
        const remaining = updated.rows[0]?.minutes_remaining ?? 0;
        await sql`
          INSERT INTO gift_call_log
            (access_code, caller_phone, character_name, duration_seconds,
             minutes_deducted, minutes_remaining_after, vapi_call_id)
          VALUES
            (${giftCode}, ${callerPhone || ''}, ${characterName}, ${durationSeconds},
             ${giftMins}, ${remaining}, ${call.id || null})
        `;
        console.log(`Gift: deducted ${giftMins} min from ${giftCode} — ${remaining} min remaining`);
      } catch (giftErr) {
        console.error('Gift minute deduction error:', giftErr.message);
      }
    }
  }

  // ── Durable per-call log ──────────────────────────────────────────────────────
  // Runs last, after billing is fully resolved, so a logging failure can never
  // affect the charge above. logCall never throws.
  const FREE_WINDOW_SECONDS = 120; // 2-minute free window, matches calcChargeAmountCents
  const reachedGate = durationSeconds >= FREE_WINDOW_SECONDS;

  await logCall({
    characterName,
    assistantId: call.assistantId,
    phoneNumberId: call.phoneNumberId,
    vapiCallId: call.id,
    durationSeconds,
    reachedGate,
    converted,
    endedReason: msg.endedReason,
    revenueCents,
    donationCents: donationCentsLogged,
    callType: 'standard',
    transactionId: paymentIntentId || null,
    raw: msg,
  });

  return res.status(200).json({ ok: true });
};
