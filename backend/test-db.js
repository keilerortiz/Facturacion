import('mssql').then(async (sql) => {
  console.log('Intentando conexión sin especificar usuario...');
  const configs = [
    {
      name: 'sa + empty password',
      config: {
        server: 'localhost',
        port: 1433,
        user: 'sa',
        password: '',
        options: {
          trustServerCertificate: true,
          encrypt: false
        }
      }
    },
    {
      name: 'sa + sa password',
      config: {
        server: 'localhost',
        port: 1433,
        user: 'sa',
        password: 'sa',
        options: {
          trustServerCertificate: true,
          encrypt: false
        }
      }
    },
    {
      name: 'localhost (default)',
      config: {
        server: 'localhost',
        options: {
          trustServerCertificate: true,
          encrypt: false
        }
      }
    }
  ];

  for (const cfg of configs) {
    try {
      console.log('Intentando: ' + cfg.name);
      const pool = new sql.default.ConnectionPool(cfg.config);
      await pool.connect();
      const result = await pool.request().query('SELECT @@SERVERNAME as ServerName, @@VERSION as Version');
      console.log('✓ Conexión exitosa');
      console.log('Server:', result.recordset[0].ServerName);
      await pool.close();
      break;
    } catch (err) {
      console.log('✗ Error:', err.message);
    }
  }
}).catch(console.error);
