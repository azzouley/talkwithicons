// api/admin/update-payout.js
// Records a payout against a donation ledger period.
// POST /api/admin/update-payout — requires x-admin-password header.
// Body: { period, aspca_paid, partner_paid }

const { sql, checkAdminAuth } = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!checkAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { period, aspca_paid, partner_paid } = req.body || {};
  if (!period || aspca_paid == null || partner_paid == null) {
    return res.status(400).json({ error: 'period, aspca_paid, and partner_paid are required' });
  }

  const aspcaCents   = Math.round(Number(aspca_paid)   * 100);
  const partnerCents = Math.round(Number(partner_paid) * 100);

  try {
    await sql`
      UPDATE donation_ledger SET
        total_paid_aspca           = total_paid_aspca           + ${aspcaCents},
        total_paid_current_partner = total_paid_current_partner + ${partnerCents},
        last_payout_at             = NOW(),
        updated_at                 = NOW()
      WHERE period = ${period}
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('admin/update-payout error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
