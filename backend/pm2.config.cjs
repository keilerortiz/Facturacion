// PM2 process manager configuration
// Usage:
//   pm2 start pm2.config.cjs --env production
//   pm2 save
//   pm2 startup   ← run once to enable auto-restart on reboot
//
// Requires: npm install -g pm2

module.exports = {
  apps: [
    {
      name: 'facturacion-api',
      script: './src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // Log files (relative to working directory)
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      // Development environment
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      // Production environment (activated with --env production)
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
