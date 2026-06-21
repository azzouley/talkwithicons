// api/admin/ledger.js
// Returns donation ledger and Grand Tour summary for the admin dashboard.
// GET /api/admin/ledger — requires x-admin-password header.

const { sql, checkAdminAuth } = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
  if (!checkAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [ledger, codes, recent] = await Promise.all([
      sql`SELECT * FROM donation_ledger ORDER BY period DESC`,
      sql`
        SELECT access_code, purchaser_name, purchaser_phone, purchaser_email,
               minutes_total, minutes_remaining, created_at, updated_at
        FROM grand_tour_balances
        ORDER BY created_at DESC
      `,
      sql`
        SELECT t.*, b.access_code
        FROM transactions t
        LEFT JOIN grand_tour_balances b ON b.purchaser_phone = t.caller_phone
        ORDER BY t.created_at DESC
        LIMIT 50
      `,
    ]);

    return res.status(200).json({
      ledger:           ledger.rows,
      grand_tour_codes: codes.rows,
      recent_transactions: recent.rows,
    });
  } catch (err) {
    console.error('admin/ledger error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
