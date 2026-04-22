import sql from 'mssql';

const config = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'Enero2026*',
  database: 'MovimientosDB',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

const pool = new sql.ConnectionPool(config);
await pool.connect();

try {
  const result = await pool.request().query(`
    SELECT TABLE_SCHEMA, TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);
  
  console.log('✓ Tablas en MovimientosDB:');
  result.recordset.forEach(r => {
    console.log(`  - ${r.TABLE_NAME}`);
  });
  console.log(`\n✓ Total: ${result.recordset.length} tablas`);
} catch (err) {
  console.error('✗ Error:', err.message);
} finally {
  await pool.close();
}