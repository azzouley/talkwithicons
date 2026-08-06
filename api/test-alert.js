// api/test-alert.js
// TEMPORARY — exercises the real recordAndAlert/sendSms path under a decoy
// service name ("test-alert-service") to prove the SMS alert channel actually
// delivers, without touching any live credential. Delete after verifying.
// Protected by CRON_SECRET, same pattern as the other monitoring endpoints.

const { recordAndAlert, ensureHealthCheckTable } = require('./_alerts');
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const state = (req.query && req.query.state) || '';

  if (state === 'cleanup') {
    await ensureHealthCheckTable();
    await sql`DELETE FROM health_check_state WHERE service = 'test-alert-service'`;
    return res.status(200).json({ ok: true, cleaned: true });
  }

  if (state !== 'healthy' && state !== 'broken') {
    return res.status(400).json({ error: 'pass ?state=healthy|broken|cleanup' });
  }

  const result = await recordAndAlert(
    'test-alert-service',
    state === 'healthy',
    state === 'broken' ? 'Manual test-triggered failure' : null
  );

  res.status(200).json({ ok: true, state, ...result });
};
