// api/_tax.js — shared Stripe Tax Calculation helper.
// Underscore prefix: excluded from Vercel routing (not a public endpoint).
//
// Every real revenue charge (the call-flow gate/overage charge in
// call-ended.js, and gift purchases in gift-purchase.js) routes through
// calculateTax() before the PaymentIntent is created, so the charged
// amount always includes correctly-calculated tax rather than the bare
// pre-tax price. TAX_CODE matches the account's own Tax Settings default
// (txcd_10000000, confirmed live via GET /v1/tax/settings on 2026-09-12)
// — not guessed here, just reused, per instruction.
const TAX_CODE = 'txcd_10000000';

// This app only ever collects a bare ZIP (see the `f-zip` field on every
// call/gift form) — no full address, no country selector. Stripe Tax
// needs a country to calculate anything, and this field's own
// inputmode="numeric" means it realistically only ever accepts a 5-digit
// US ZIP (a Canadian postal code, e.g. "K1A 0B1", can't be typed on the
// numeric mobile keypad it produces) — so this validates US ZIPs only.
// A non-US customer therefore always falls into the "can't determine
// location" fallback below, which is a real, pre-existing gap in the ZIP
// field itself (it doesn't actually support Canadian input despite
// "Available to callers in the US and Canada" on every page) — flagged,
// not silently solved here, since fixing the input UX is a separate task.
const US_ZIP_RE = /^\d{5}(-\d{4})?$/;

/**
 * Calculates tax for a single-line charge and returns the amount to
 * actually charge (pre-tax + tax) plus a flat object meant to be spread
 * directly into a PaymentIntent's `metadata`.
 *
 * Never throws — a failure (bad/missing ZIP, Stripe API error, etc.)
 * resolves to the same shape with ok:false, so callers always get a
 * usable totalCents back and can decide how to proceed. See
 * project_talkwithicons memory for why the fallback is "charge the
 * pre-tax amount, flag it in metadata" rather than blocking the charge
 * or guessing a tax amount.
 *
 * @param {number} preTaxCents - the base charge amount before tax
 * @param {string} postalCode - raw ZIP value from the caller's saved
 *   billing details or form input, may be missing/malformed
 * @param {string} reference - short label for this line item, shows up
 *   in Stripe's tax reports (e.g. "call-gate-fee", "gift-gift-30")
 * @returns {Promise<{ok: boolean, totalCents: number, metadata: object}>}
 */
async function calculateTax(stripe, preTaxCents, postalCode, reference) {
  const zip = (postalCode || '').trim();

  if (!US_ZIP_RE.test(zip)) {
    return {
      ok: false,
      totalCents: preTaxCents,
      metadata: {
        tax_status: 'not_calculated',
        tax_status_reason: zip ? 'unrecognized_postal_code_format' : 'no_postal_code_on_file',
      },
    };
  }

  try {
    const calculation = await stripe.tax.calculations.create({
      currency: 'usd',
      line_items: [
        {
          amount: preTaxCents,
          reference,
          tax_code: TAX_CODE,
        },
      ],
      customer_details: {
        address: { country: 'US', postal_code: zip },
        address_source: 'billing',
      },
    });

    const taxCents = calculation.tax_amount_exclusive;
    const firstRate = calculation.tax_breakdown?.[0]?.tax_rate_details;

    return {
      ok: true,
      totalCents: calculation.amount_total,
      metadata: {
        tax_status: 'calculated',
        tax_calculation_id: calculation.id || '',
        tax_amount_cents: String(taxCents),
        tax_rate_percent: firstRate?.percentage_decimal || '',
        tax_state: firstRate?.state || '',
        pre_tax_amount_cents: String(preTaxCents),
      },
    };
  } catch (err) {
    console.error('Stripe Tax calculation error:', err.message, { preTaxCents, zip, reference });
    return {
      ok: false,
      totalCents: preTaxCents,
      metadata: {
        tax_status: 'not_calculated',
        tax_status_reason: 'stripe_tax_api_error',
      },
    };
  }
}

module.exports = { calculateTax, TAX_CODE, US_ZIP_RE };
