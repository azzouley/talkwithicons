// api/admin/test-mode.js
// GET  → { testMode: bool }
// POST { enabled: bool } → upserts app_settings, invalidates cache, returns { testMode }

const { sql, checkAdminAuth, invalidateTestModeCache } = require('../_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!checkAdminAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    try {
      const result = await sql`SELECT value FROM app_settings WHERE key = 'test_mode'`;
      const testMode = result.rows[0]?.value === 'true';
      return res.status(200).json({ testMode });
    } catch (err) {
      console.error('test-mode GET error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { enabled } = req.body || {};
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled (boolean) is required' });
    }
    try {
      await sql`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES ('test_mode', ${enabled ? 'true' : 'false'}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      invalidateTestModeCache();
      return res.status(200).json({ testMode: enabled });
    } catch (err) {
      console.error('test-mode POST error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
