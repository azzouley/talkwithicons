// api/meals-count.js
// Returns the number of rescue-dog meals funded this month, derived from the
// donation_ledger table (each meal = $0.50 = 50 cents).

const { sql, getCurrentPeriod } = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const period = getCurrentPeriod();
    const result = await sql`
      SELECT total_donations_accrued
      FROM donation_ledger
      WHERE period = ${period}
    `;
    const totalCents = result.rows[0]?.total_donations_accrued || 0;
    const meals = Math.floor(totalCents / 50);
    return res.status(200).json({ meals });
  } catch (err) {
    console.error('meals-count error:', err.message);
    return res.status(200).json({ meals: 0 });
  }
};
