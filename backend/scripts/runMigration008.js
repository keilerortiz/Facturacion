import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.resolve(__dirname, '../database/migrations/008_create_jobs_table.sql');

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

console.log('[migration] 008 applied — Jobs table created');

const verify = await pool.request().query(`
  SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'Jobs'
  ORDER BY ORDINAL_POSITION
`);
console.log('\n[verify] Jobs columns:');
console.table(verify.recordset);

const indexes = await pool.request().query(`
  SELECT name, type_desc
  FROM sys.indexes
  WHERE object_id = OBJECT_ID('Jobs')
  ORDER BY name
`);
console.log('\n[verify] Jobs indexes:');
console.table(indexes.recordset);

await pool.close();
console.log('\n✓ Migration 008 completed successfully');
