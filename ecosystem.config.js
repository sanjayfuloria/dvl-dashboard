module.exports = {
  apps: [
    {
      name: 'dvl-dashboard',
      script: './node_modules/.bin/next',
      args: 'start --port 3001',
      cwd: '/var/www/dvl-dashboard',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        AUTH_TRUST_HOST: 'true',
        NEXTAUTH_URL: 'https://www.sanjayfuloria.tech/dvl',
        AUTH_URL: 'https://www.sanjayfuloria.tech/dvl',
        EMAIL_FROM: 'DVL Dashboard <noreply@sanjayfuloria.tech>',
      },
      error_file: '/root/.pm2/logs/dvl-dashboard-error.log',
      out_file: '/root/.pm2/logs/dvl-dashboard-out.log',
    },
  ],
}
