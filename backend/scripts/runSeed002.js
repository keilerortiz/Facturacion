import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFile = path.resolve(__dirname, '../database/seeds/002_seed_test_data.sql');

function splitSqlBatches(content) {
  return content.split(/^\s*GO\s*$/gim).map((b) => b.trim()).filter(Boolean);
}

const pool = await new sql.ConnectionPool(env.db).connect();
console.log('[db] Connected to', env.db.server + '/' + env.db.database);

const content = await fs.readFile(seedFile, 'utf8');
const batches = splitSqlBatches(content);

// All batches except the last one (validation query) are DDL/DML
for (let i = 0; i < batches.length - 1; i++) {
  await pool.request().batch(batches[i]);
}

// Last batch is the validation SELECT — print results as table
const validationResult = await pool.request().batch(batches[batches.length - 1]);
console.log('\n=== Validation: propietarios con VTAs y tarifas ===');
console.table(validationResult.recordset);

await pool.close();
console.log('\n[seed] 002_seed_test_data.sql ejecutado correctamente');
