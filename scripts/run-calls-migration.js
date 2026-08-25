// ============================================================================
// run-calls-migration.js
// Runs migrations/001_create_calls_table.sql against the Neon DB.
// Rule 7 (backup before changing live infra): before running, it snapshots the
// current list of tables and the calls-table definition (if any) to
// vapi-backup/ so there is a written before-state. Idempotent SQL means
// re-running is safe.
//
// Usage:  node --use-system-ca scripts/run-calls-migration.js
// Requires: DATABASE_URL in the environment (same var the app already uses).
// ============================================================================

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set. Export it (Neon connection string) and retry.');
  process.exit(1);
}

const SQL_PATH = path.join(__dirname, '..', 'migrations', '001_create_calls_table.sql');
const BACKUP_DIR = path.join(__dirname, '..', 'vapi-backup');

async function main() {
  const sql = fs.readFileSync(SQL_PATH, 'utf8');
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    // --- before-state snapshot (Rule 7) ---
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' ORDER BY table_name`
    );
    const callsCols = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name='calls' ORDER BY ordinal_position`
    );
    const snapshot = {
      when: stamp,
      tables_before: tables.rows.map(r => r.table_name),
      calls_table_existed: callsCols.rows.length > 0,
      calls_columns_before: callsCols.rows,
    };
    const snapPath = path.join(BACKUP_DIR, `calls-migration-pre-${stamp}.json`);
    fs.writeFileSync(snapPath, JSON.stringify(snapshot, null, 2));
    console.log('Backup written:', snapPath);
    console.log('Tables before:', snapshot.tables_before.join(', '));

    // --- run migration ---
    await client.query(sql);
    console.log('Migration executed.');

    // --- verify (Rule 4) ---
    const after = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema='public' AND table_name='calls' ORDER BY ordinal_position`
    );
    if (after.rows.length === 0) {
      throw new Error('Verification failed: calls table not present after migration.');
    }
    console.log(`Verified: calls table has ${after.rows.length} columns.`);
    after.rows.forEach(r => console.log('  -', r.column_name, r.data_type));

    const idx = await client.query(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname='public' AND tablename='calls' ORDER BY indexname`
    );
    console.log('Indexes:', idx.rows.map(r => r.indexname).join(', '));
    console.log('\nDone. Safe to re-run.');
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
