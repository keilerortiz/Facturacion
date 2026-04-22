import sql from "mssql";

const config = {
  server: "localhost",
  port: 1433,
  user: "sa",
  password: "Enero2026*",
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

try {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  console.log("✓ Conexión exitosa a SQL Server");
  
  const result = await pool.request().query("SELECT @@SERVERNAME as ServerName");
  console.log("✓ Server:", result.recordset[0].ServerName);
  
  const dbResult = await pool.request().query("SELECT name FROM sys.databases WHERE name = 'MovimientosDB'");
  if (dbResult.recordset.length > 0) {
    console.log("✓ Base de datos MovimientosDB existe");
    
    // Verificar tablas
    const tablesResult = await pool.request().query("SELECT name FROM sys.tables WHERE name IN ('Usuarios', 'Propietarios', 'VTAs', 'Tarifas', 'Movimientos')");
    console.log("✓ Tablas encontradas:", tablesResult.recordset.length);
  } else {
    console.log("✗ Base de datos MovimientosDB NO existe");
  }
  
  await pool.close();
} catch (err) {
  console.log("✗ Error:", err.message);
  process.exit(1);
}
