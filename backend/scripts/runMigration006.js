import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationFile = path.resolve(__dirname, '../database/migrations/006_refresh_token_indexes_familia.sql');

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

console.log('[migration] 006 applied — familia column and indexes added to RefreshTokens');

// Verify column exists
const verify = await pool.request().query(`
  SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'RefreshTokens'
    AND COLUMN_NAME = 'familia'
`);
console.log('\n[verify] familia column:');
console.table(verify.recordset);

// Verify indexes exist
const indexes = await pool.request().query(`
  SELECT name, type_desc
  FROM sys.indexes
  WHERE object_id = OBJECT_ID('RefreshTokens')
    AND name IN ('IX_RefreshTokens_TokenHash', 'IX_RefreshTokens_UsuarioId_ExpiraEn')
  ORDER BY name
`);
console.log('\n[verify] refresh token indexes:');
console.table(indexes.recordset);

await pool.close();
console.log('\n✓ Migration 006 completed successfully');
