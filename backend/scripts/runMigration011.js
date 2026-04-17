import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.resolve(__dirname, '../database/migrations/011_add_ceco_to_tarifas.sql');

function splitSqlBatches(content) {
  return content
    .split(/^GO$/gm)
    .map((batch) => batch.trim())
    .filter((batch) => batch.length > 0);
}

async function main() {
  const pool = await new sql.ConnectionPool(env.db).connect();
  console.log('[db] Connected to', env.db.server + '/' + env.db.database);

  const content = await fs.readFile(migrationFile, 'utf8');
  const batches = splitSqlBatches(content);

  for (const batch of batches) {
    await pool.request().batch(batch);
  }

  console.log('[migration] 011 applied — CECO column added to Tarifas');

  // Verify column exists
  const verify = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Tarifas' AND COLUMN_NAME = 'ceco'
  `);
  console.table(verify.recordset);

  await pool.close();
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
