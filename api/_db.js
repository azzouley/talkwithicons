// api/_db.js — shared DB + business-logic helpers
// Underscore prefix: excluded from Vercel routing (not a public endpoint).

const { sql } = require('@vercel/postgres');

// 8-char access codes — unambiguous charset (no 0/O/1/I)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const GRAND_TOUR_MINUTES       = 100;
const GRAND_TOUR_PRICE_CENTS   = 7900;  // $79.00
const GRAND_TOUR_DONATION_CENTS = 800;  // flat $8.00

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
  GRAND_TOUR_MINUTES,
  GRAND_TOUR_PRICE_CENTS,
  GRAND_TOUR_DONATION_CENTS,
};
