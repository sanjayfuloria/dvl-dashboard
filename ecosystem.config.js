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
        AUTH_SECRET: '2dca14b929977260e028194352de9bd7bfa1d173590f39026c990a33dd1a7ad3',
        NEXTAUTH_URL: 'https://www.sanjayfuloria.tech/dvl',
        AUTH_URL: 'https://www.sanjayfuloria.tech/dvl',
        DATABASE_URL: 'postgresql://dvl_user:DVLpass2025@localhost:5432/dvl_dashboard',
        RESEND_API_KEY: 're_iYGoFkqV_LJxYa5oryWhXNTUzLJQNHf7S',
        EMAIL_FROM: 'DVL Dashboard <noreply@sanjayfuloria.tech>',
      },
      error_file: '/root/.pm2/logs/dvl-dashboard-error.log',
      out_file: '/root/.pm2/logs/dvl-dashboard-out.log',
    },
  ],
}
