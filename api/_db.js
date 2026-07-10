// api/_db.js — shared DB + business-logic helpers
// Underscore prefix: excluded from Vercel routing (not a public endpoint).

const { sql } = require('@vercel/postgres');

// 8-char access codes — unambiguous charset (no 0/O/1/I)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const GRAND_TOUR_MINUTES       = 100;
const GRAND_TOUR_PRICE_CENTS   = 7900;  // $79.00
const GRAND_TOUR_DONATION_CENTS = 800;  // flat $8.00

const GIFT_PACKAGES = {
  // Legacy character-specific packages (kept for idempotency of existing codes)
  'einstein-evening':    { character: 'einstein',   minutesTotal: 15, priceCents: 1199, label: 'The Einstein Evening',       description: '15 minutes with Albert Einstein' },
  'holmes-consultation': { character: 'holmes',     minutesTotal: 20, priceCents: 1699, label: 'A Consultation with Holmes', description: '20 minutes at 221B Baker Street' },
  'evangeline-reading':  { character: 'evangeline', minutesTotal: 20, priceCents: 1699, label: 'A Reading with Evangeline',  description: '20 minutes with Evangeline Adams' },
  'aela-evening':        { character: 'aela',       minutesTotal: 30, priceCents: 2699, label: 'An Evening with Aela',       description: '30 minutes with the Pleiadian Liaison' },
  // Time-based packages — recipient's choice of any character
  'gift-15':             { character: null,          minutesTotal: 15, priceCents: 1295, label: '15-Minute Gift Call',        description: '15 minutes with the icon of their choice' },
  'gift-20':             { character: null,          minutesTotal: 20, priceCents: 1895, label: '20-Minute Gift Call',        description: '20 minutes with the icon of their choice' },
  'gift-30':             { character: null,          minutesTotal: 30, priceCents: 2799, label: '30-Minute Gift Call',        description: '30 minutes with the icon of their choice' },
};
const GIFT_DONATION_CENTS = 50; // $0.50 flat per gift purchase

function generateAccessCode() {
  const { randomBytes } = require('crypto');
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) code += CHARSET[bytes[i] % 32];
  return code;
}

// Per-call donation: $0.50 minimum on any paid call, +$0.10/min after minute 5.
function calcPerCallDonationCents(durationSeconds) {
  const minutes = Math.ceil(durationSeconds / 60);
  if (minutes <= 2) return 0;   // free call — no donation
  if (minutes <= 5) return 50;  // $0.50
  return 50 + (minutes - 5) * 10;
}

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getCurrentPartner() {
  return process.env.CURRENT_RESCUE_PARTNER || 'Rochester Animal Services';
}

function getDonationSplit(donationCents) {
  const aspca   = Math.round(donationCents * 0.25);
  const partner = donationCents - aspca;
  return { ASPCA: aspca, current_partner: partner, partner_name: getCurrentPartner() };
}

async function updateDonationLedger(donationCents) {
  if (donationCents <= 0) return;
  const period      = getCurrentPeriod();
  const partnerName = getCurrentPartner();
  const aspca       = Math.round(donationCents * 0.25);
  const partner     = donationCents - aspca;

  await sql`
    INSERT INTO donation_ledger
      (period, total_donations_accrued, amount_owed_aspca, amount_owed_current_partner, partner_name, updated_at)
    VALUES
      (${period}, ${donationCents}, ${aspca}, ${partner}, ${partnerName}, NOW())
    ON CONFLICT (period) DO UPDATE SET
      total_donations_accrued     = donation_ledger.total_donations_accrued     + ${donationCents},
      amount_owed_aspca           = donation_ledger.amount_owed_aspca           + ${aspca},
      amount_owed_current_partner = donation_ledger.amount_owed_current_partner + ${partner},
      partner_name                = EXCLUDED.partner_name,
      updated_at                  = NOW()
  `;
}

// ── Test mode helpers ─────────────────────────────────────────────────────────
let _testModeCache = { value: null, at: 0 };

async function getTestMode() {
  const now = Date.now();
  if (_testModeCache.value !== null && now - _testModeCache.at < 30000) {
    return _testModeCache.value;
  }
  try {
    const result = await sql`SELECT value FROM app_settings WHERE key = 'test_mode'`;
    const val = result.rows[0]?.value === 'true';
    _testModeCache = { value: val, at: now };
    return val;
  } catch (err) {
    console.error('getTestMode error:', err.message);
    return false;
  }
}

function invalidateTestModeCache() {
  _testModeCache = { value: null, at: 0 };
}

async function getStripeSecretKey() {
  const testMode = await getTestMode();
  return testMode
    ? process.env.STRIPE_SECRET_KEY_TEST
    : process.env.STRIPE_SECRET_KEY;
}

async function getStripePublicKey() {
  const testMode = await getTestMode();
  return testMode
    ? process.env.STRIPE_PUBLIC_KEY_TEST
    : process.env.STRIPE_PUBLIC_KEY;
}

function normalizePhone(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits[0] === '1') return '+' + digits;
  return '+' + digits;
}

function checkAdminAuth(req) {
  const provided = req.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;
  return expected && provided === expected;
}

module.exports = {
  sql,
  generateAccessCode,
  calcPerCallDonationCents,
  getCurrentPeriod,
  getCurrentPartner,
  getDonationSplit,
  updateDonationLedger,
  normalizePhone,
  checkAdminAuth,
  getTestMode,
  invalidateTestModeCache,
  getStripeSecretKey,
  getStripePublicKey,
  GRAND_TOUR_MINUTES,
  GRAND_TOUR_PRICE_CENTS,
  GRAND_TOUR_DONATION_CENTS,
  GIFT_PACKAGES,
  GIFT_DONATION_CENTS,
};
