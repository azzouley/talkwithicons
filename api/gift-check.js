// api/gift-check.js
// Pre-call validation for gift access codes.
// POST /api/gift-check
// Body: { giftCode, phoneNumber, character }
// Returns: { valid, minutesRemaining } or { valid: false, reason }

const { sql, normalizePhone } = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { giftCode, phoneNumber, character } = req.body || {};
  if (!giftCode || !phoneNumber) {
    return res.status(400).json({ error: 'giftCode and phoneNumber are required' });
  }

  const code  = giftCode.trim().toUpperCase();
  const phone = normalizePhone(phoneNumber);

  try {
    const result = await sql`
      SELECT access_code, character_key, phone_locked_to, minutes_remaining, expires_at
      FROM gift_balances WHERE access_code = ${code}
    `;

    if (result.rows.length === 0) {
      return res.status(200).json({ valid: false, reason: 'Code not found' });
    }

    const row = result.rows[0];

    if (character && row.character_key !== character.toLowerCase()) {
      return res.status(200).json({ valid: false, reason: 'This code is for a different character' });
    }

    if (new Date(row.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, reason: 'This code has expired' });
    }

    if (row.phone_locked_to && row.phone_locked_to !== phone) {
      return res.status(200).json({ valid: false, reason: 'Phone number does not match this code' });
    }

    if (row.minutes_remaining < 5) {
      return res.status(200).json({
        valid:            false,
        reason:           'Insufficient minutes remaining',
        minutesRemaining: row.minutes_remaining,
      });
    }

    return res.status(200).json({ valid: true, minutesRemaining: row.minutes_remaining });
  } catch (err) {
    console.error('gift-check error:', err.message);
    return res.status(500).json({ error: 'Database error' });
  }
};
