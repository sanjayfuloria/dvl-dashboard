module.exports = {
  apps: [
    {
      name: 'dvl-dashboard',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/var/www/dvl-dashboard',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '/var/log/dvl/error.log',
      out_file: '/var/log/dvl/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
