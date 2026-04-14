import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.resolve(__dirname, '../database/migrations/002_add_tipovta_udmvta_tarifa_total.sql');

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

console.log('[migration] 002 applied — tipovta, udmvta, tarifa, total columns added');

// Verify columns exist
const verify = await pool.request().query(`
  SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME IN ('VTAs','Movimientos')
    AND COLUMN_NAME IN ('tipovta','udmvta','tarifa','total')
  ORDER BY TABLE_NAME, COLUMN_NAME
`);
console.table(verify.recordset);

await pool.close();
