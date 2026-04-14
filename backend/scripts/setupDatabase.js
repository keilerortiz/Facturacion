import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const createDatabaseScript = path.join(backendRoot, 'database', 'scripts', '000_create_database.sql');
const schemaScripts = [
  path.join(backendRoot, 'database', 'scripts', '001_create_tables.sql'),
  path.join(backendRoot, 'database', 'scripts', '002_create_constraints_relationships.sql'),
  path.join(backendRoot, 'database', 'scripts', '003_create_indexes.sql')
];
const verificationScript = path.join(backendRoot, 'database', 'scripts', '004_verify_integrity.sql');
const seedScript = path.join(backendRoot, 'database', 'seeds', '001_seed_minimal_data.sql');

function getConfig(databaseName) {
  return {
    ...env.db,
    database: databaseName
  };
}

function splitSqlBatches(content) {
  return content
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

async function runSqlFile(pool, filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const batches = splitSqlBatches(content);

  for (const batch of batches) {
    await pool.request().batch(batch);
  }
}

async function validateSchema(pool) {
  const tablesResult = await pool.request().query(`
    SELECT name
    FROM sys.tables
    WHERE name IN ('Usuarios', 'Propietarios', 'VTAs', 'Tarifas', 'RefreshTokens', 'Movimientos', 'Logs')
    ORDER BY name
  `);

  const tableNames = tablesResult.recordset.map((row) => row.name);
  const expectedTables = [
    'Logs',
    'Movimientos',
    'Propietarios',
    'RefreshTokens',
    'Tarifas',
    'Usuarios',
    'VTAs'
  ];

  if (tableNames.length !== expectedTables.length) {
    throw new Error(`Schema incompleto. Tablas detectadas: ${tableNames.join(', ')}`);
  }

  const fkResult = await pool.request().query(`
    SELECT name
    FROM sys.foreign_keys
    WHERE name IN (
      'FK_VTAs_Propietarios',
      'FK_Tarifas_Propietarios',
      'FK_Tarifas_VTAs',
      'FK_Tarifas_VTAs_Propietario',
      'FK_RefreshTokens_Usuarios',
      'FK_Movimientos_Propietarios',
      'FK_Movimientos_VTAs',
      'FK_Movimientos_VTAs_Propietario',
      'FK_Movimientos_UsuariosCreacion',
      'FK_Movimientos_UsuariosModificacion',
      'FK_Logs_Movimientos'
    )
  `);

  if (fkResult.recordset.length < 11) {
    throw new Error(`Faltan relaciones FK. Encontradas: ${fkResult.recordset.length}`);
  }

  return {
    tables: tableNames,
    foreignKeys: fkResult.recordset.map((row) => row.name)
  };
}

async function validateSeed(pool) {
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.Usuarios WHERE rol = 'admin') AS admin_count,
      (SELECT COUNT(*) FROM dbo.Propietarios) AS propietarios_count,
      (SELECT COUNT(*) FROM dbo.VTAs) AS vtas_count,
      (SELECT COUNT(*) FROM dbo.Tarifas WHERE activa = 1) AS tarifas_activas_count
  `);

  const summary = result.recordset[0];

  if (summary.admin_count < 1) {
    throw new Error('Seed invalido: no existe usuario administrador');
  }

  if (summary.propietarios_count < 2) {
    throw new Error('Seed invalido: se esperaban al menos 2 propietarios');
  }

  if (summary.vtas_count < 3) {
    throw new Error('Seed invalido: se esperaban al menos 3 VTAs');
  }

  if (summary.tarifas_activas_count < 3) {
    throw new Error('Seed invalido: se esperaban al menos 3 tarifas activas');
  }

  return summary;
}

async function main() {
  let masterPool;
  let appPool;

  try {
    masterPool = await sql.connect(getConfig('master'));
    console.log(`[setup-db] Conectado a master en ${env.db.server}`);
    await runSqlFile(masterPool, createDatabaseScript);
    await masterPool.close();

    appPool = await sql.connect(getConfig(env.db.database));
    console.log(`[setup-db] Conectado a ${env.db.database}`);

    for (const filePath of schemaScripts) {
      console.log(`[setup-db] Ejecutando ${path.basename(filePath)}`);
      await runSqlFile(appPool, filePath);
    }

    console.log(`[setup-db] Ejecutando ${path.basename(seedScript)}`);
    await runSqlFile(appPool, seedScript);

    console.log(`[setup-db] Ejecutando ${path.basename(verificationScript)}`);
    await runSqlFile(appPool, verificationScript);

    const schema = await validateSchema(appPool);
    const seed = await validateSeed(appPool);

    console.log('[setup-db] Base de datos lista');
    console.log(
      JSON.stringify(
        {
          database: env.db.database,
          tables: schema.tables,
          foreignKeys: schema.foreignKeys.length,
          seed
        },
        null,
        2
      )
    );
  } finally {
    await masterPool?.close().catch(() => undefined);
    await appPool?.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('[setup-db] Error fatal', error);
  process.exitCode = 1;
});
