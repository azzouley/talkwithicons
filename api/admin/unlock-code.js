// api/admin/unlock-code.js
// Unlocks a Grand Tour code from its bound phone, or rebinds it to a new phone.
// POST /api/admin/unlock-code — requires x-admin-password header.
// Body: { accessCode, newPhone? }
//   newPhone omitted or empty → sets purchaser_phone to NULL (fully portable)
//   newPhone provided          → rebinds to that number

const { sql, checkAdminAuth, normalizePhone } = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!checkAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { accessCode, newPhone } = req.body || {};
  if (!accessCode) return res.status(400).json({ error: 'accessCode is required' });

  const code  = (accessCode || '').trim().toUpperCase();
  const phone = newPhone ? normalizePhone(newPhone) : null;

  try {
    const result = await sql`
      UPDATE grand_tour_balances
      SET purchaser_phone = ${phone}, updated_at = NOW()
      WHERE access_code = ${code}
      RETURNING access_code, purchaser_phone, minutes_remaining
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Code not found' });
    }

    return res.status(200).json({
      ok:   true,
      code: result.rows[0],
    });
  } catch (err) {
    console.error('admin/unlock-code error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
