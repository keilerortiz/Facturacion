import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationFile = path.resolve(__dirname, '../database/migrations/009_add_scalability_indexes.sql');

function splitSqlBatches(content) {
  return content.split(/^\s*GO\s*$/gim).map((batch) => batch.trim()).filter(Boolean);
}

const pool = await new sql.ConnectionPool(env.db).connect();
console.log('[db] Connected to', env.db.server + '/' + env.db.database);

const content = await fs.readFile(migrationFile, 'utf8');
const batches = splitSqlBatches(content);

for (const batch of batches) {
  await pool.request().batch(batch);
}

const indexes = await pool.request().query(`
  SELECT name, OBJECT_NAME(object_id) AS table_name
  FROM sys.indexes
  WHERE name IN (
    'IX_Propietarios_Nombre',
    'IX_VTAs_Propietario_Codigo_Nombre',
    'IX_Tarifas_ActivaLookup_Vigencia',
    'IX_Movimientos_Fecha_Id'
  )
  ORDER BY name
`);

console.table(indexes.recordset);
await pool.close();
console.log('\n✓ Migration 009 completed successfully');
