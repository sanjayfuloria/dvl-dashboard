#!/bin/bash
# DVL Dashboard — Hostinger VPS Setup Script
# Run as root on a fresh Ubuntu 22.04 LTS VPS
# Usage: bash setup-vps.sh

set -e
echo "🚀 DVL Dashboard VPS Setup"
echo "================================"

# ── 1. System updates ──────────────────────────────────────────────
echo "📦 Updating system packages..."
apt update && apt upgrade -y
apt install -y curl git nginx certbot python3-certbot-nginx ufw fail2ban

# ── 2. Node.js 20 ─────────────────────────────────────────────────
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2

# ── 3. PostgreSQL ─────────────────────────────────────────────────
echo "🗄️  Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'SQL'
CREATE USER dvl_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';
CREATE DATABASE dvl_dashboard OWNER dvl_user;
GRANT ALL PRIVILEGES ON DATABASE dvl_dashboard TO dvl_user;
SQL
echo "✅ PostgreSQL configured (remember to change the password!)"

# ── 4. Firewall ───────────────────────────────────────────────────
echo "🔒 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# ── 5. App directory ──────────────────────────────────────────────
echo "📁 Setting up app directory..."
mkdir -p /var/www/dvl-dashboard
mkdir -p /var/log/dvl
chown -R $SUDO_USER:$SUDO_USER /var/www/dvl-dashboard
chown -R $SUDO_USER:$SUDO_USER /var/log/dvl

# ── 6. Clone repo ─────────────────────────────────────────────────
echo "📥 Ready to clone your repository."
echo "   Run: git clone https://github.com/YOUR_ORG/dvl-dashboard.git /var/www/dvl-dashboard"

# ── 7. Nginx config ───────────────────────────────────────────────
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/dvl-dashboard << 'NGINX'
server {
    listen 80;
    server_name YOUR_DOMAIN.edu.in;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/dvl-dashboard /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "  1. Clone your repo:  git clone <your-repo-url> /var/www/dvl-dashboard"
echo "  2. Create .env:      cp .env.example .env && nano .env"
echo "  3. Install deps:     cd /var/www/dvl-dashboard && npm ci"
echo "  4. Run migrations:   npx prisma migrate deploy"
echo "  5. Seed database:    npm run db:seed"
echo "  6. Build app:        npm run build"
echo "  7. Start with PM2:   pm2 start ecosystem.config.js --env production"
echo "  8. Save PM2:         pm2 save && pm2 startup"
echo "  9. SSL cert:         certbot --nginx -d YOUR_DOMAIN.edu.in"
echo ""
echo "GitHub Actions secrets to set:"
echo "  VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_PORT"
echo "  DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL"
echo "  RESEND_API_KEY, EMAIL_FROM"
