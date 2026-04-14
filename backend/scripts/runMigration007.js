import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.resolve(__dirname, '../database/migrations/007_add_version_optimistic_locking.sql');

function splitSqlBatches(content) {
  return content.split(/^\s*GO\s*$/gim).map((b) => b.trim()).filter(Boolean);
}

const pool = await new sql.ConnectionPool(env.db).connect();
console.log('[db] Connected to', env.db.server + '/' + env.db.database);

const content = await fs.readFile(migrationFile, 'utf8');
const batches = splitSqlBatches(content);

for (const batch of batches) {
  await pool.request().batch(batch);
}

console.log('[migration] 007 applied — version column added to Movimientos');

// Verify column exists
const verify = await pool.request().query(`
  SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Movimientos'
    AND COLUMN_NAME = 'version'
`);
console.log('\n[verify] version column:');
console.table(verify.recordset);

// Verify existing rows have version = 1
const countCheck = await pool.request().query(`
  SELECT COUNT(*) AS total, MIN(version) AS minVersion, MAX(version) AS maxVersion
  FROM Movimientos
`);
console.log('\n[verify] existing rows:');
console.table(countCheck.recordset);

await pool.close();
console.log('\n✓ Migration 007 completed successfully');
