// api/grand-tour-check.js
// Pre-call validation for Grand Tour access codes.
// POST /api/grand-tour-check
// Body: { tourCode, phoneNumber }
// Returns: { valid, minutesRemaining } or { valid: false, reason }

const { sql, normalizePhone } = require('./_db');

const MIN_MINUTES_TO_START = 6;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { tourCode, phoneNumber } = req.body || {};
  if (!tourCode || !phoneNumber) {
    return res.status(400).json({ error: 'tourCode and phoneNumber are required' });
  }

  const code  = (tourCode || '').trim().toUpperCase();
  const phone = normalizePhone(phoneNumber);

  try {
    const result = await sql`
      SELECT access_code, purchaser_phone, minutes_remaining
      FROM grand_tour_balances
      WHERE access_code = ${code}
    `;

    if (result.rows.length === 0) {
      return res.status(200).json({ valid: false, reason: 'Code not found' });
    }

    const row = result.rows[0];

    // Phone-lock check: if purchaser_phone is set, it must match the caller
    if (row.purchaser_phone && row.purchaser_phone !== phone) {
      return res.status(200).json({ valid: false, reason: 'Phone number does not match this code' });
    }

    if (row.minutes_remaining < MIN_MINUTES_TO_START) {
      return res.status(200).json({
        valid:            false,
        reason:           'Insufficient minutes remaining',
        minutesRemaining: row.minutes_remaining,
      });
    }

    return res.status(200).json({
      valid:            true,
      minutesRemaining: row.minutes_remaining,
    });
  } catch (err) {
    console.error('grand-tour-check error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
};
