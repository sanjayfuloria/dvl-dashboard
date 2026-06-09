# DVL Dashboard
### Digital Venture Lab — ICFAI Foundation for Higher Education (IFHE), Hyderabad

The operating system for the Digital Venture Lab. Manage the complete lifecycle of AI-enabled digital product development — from idea to MVP — for students, faculty, mentors, and administrators.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| Authentication | NextAuth v5 + Resend magic links |
| Styling | Tailwind CSS + custom design tokens |
| Email | Resend |
| File storage | Google Drive API (service account) |
| Deployment | Hostinger VPS + Nginx + PM2 |
| CI/CD | GitHub Actions |

---

## Features

### 4 Role Portals
- **Student** — venture profile, milestones, AI build log, reflections, portfolio
- **Faculty** — team monitoring, evaluations, feedback, analytics
- **Mentor** — assigned teams, session records, recommendations
- **Admin** — full user management, programme analytics, milestone config, reports

### Core Modules
1. Dashboard home (role-specific views)
2. Team & venture management
3. DVL journey (Ideation → Prototype → MVP)
4. AI Build Log (responsible AI documentation)
5. Mentor management & session records
6. Evaluation module (3-phase scorecards)
7. Progress reflection module
8. Knowledge repository
9. Analytics dashboard
10. Demo Day showcase
11. Placement portfolio
12. Administrative reports

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- A [Resend](https://resend.com) account (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/dvl-dashboard.git
cd dvl-dashboard
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL="postgresql://dvl_user:password@localhost:5432/dvl_dashboard"
AUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
EMAIL_FROM="DVL Dashboard <noreply@yourdomain.com>"
```

### 3. Set up the database

```bash
# Create the database
createdb dvl_dashboard

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with demo data
npm run db:seed
```

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo login emails** (use magic link):
- `admin@dvl.ifhe.edu.in` — Admin
- `faculty@ifhe.edu.in` — Faculty
- `mentor@example.com` — Mentor  
- `student@ifhe.edu.in` — Student

> In development, the magic link URL is printed to the **terminal** (no actual email sent unless Resend is configured).

---

## Production Deployment on Hostinger VPS

### Step 1 — Provision VPS

Recommended: Ubuntu 22.04 LTS, minimum 2 vCPU / 2GB RAM.

### Step 2 — Run server setup script

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Download and run the setup script
curl -O https://raw.githubusercontent.com/YOUR_ORG/dvl-dashboard/main/deploy/setup-vps.sh
bash setup-vps.sh
```

This installs Node.js 20, PostgreSQL, Nginx, PM2, and configures the firewall.

### Step 3 — Clone the repo

```bash
cd /var/www
git clone https://github.com/YOUR_ORG/dvl-dashboard.git
cd dvl-dashboard
```

### Step 4 — Configure environment

```bash
cp .env.example .env
nano .env
# Fill in all values (especially AUTH_SECRET, NEXTAUTH_URL with your real domain)
```

### Step 5 — Install, migrate, build

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run build

# Copy static files for standalone output
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

### Step 6 — Start with PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the instruction it prints
```

### Step 7 — Configure Nginx

```bash
# Update the domain name in the nginx config
nano /etc/nginx/sites-available/dvl-dashboard
# Replace YOUR_DOMAIN.edu.in with your real domain

nginx -t && systemctl reload nginx
```

### Step 8 — SSL certificate (Let's Encrypt)

```bash
certbot --nginx -d dvl.ifhe.edu.in
```

### Step 9 — Set up GitHub Actions for auto-deploy

Add these secrets in GitHub → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | SSH username (e.g. `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key (contents of `~/.ssh/id_rsa`) |
| `VPS_PORT` | SSH port (default: `22`) |
| `DATABASE_URL` | Full PostgreSQL connection string |
| `AUTH_SECRET` | Your AUTH_SECRET value |
| `NEXTAUTH_URL` | `https://dvl.ifhe.edu.in` |
| `RESEND_API_KEY` | Your Resend API key |
| `EMAIL_FROM` | From email address |

After this, every push to `main` automatically deploys.

---

## Google Drive Integration

### Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Google Drive API**
3. Create a **Service Account** → Download JSON key
4. Install the auth library: `npm install google-auth-library`
5. Share your root Google Drive folder with the service account email
6. Add to `.env`:
   ```env
   GOOGLE_SERVICE_ACCOUNT_EMAIL="dvl@your-project.iam.gserviceaccount.com"
   GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
   GOOGLE_DRIVE_ROOT_FOLDER_ID="1abc123..."
   ```
7. Update `lib/google-drive.ts` — replace the `getAccessToken()` stub with:
   ```ts
   import { GoogleAuth } from 'google-auth-library'
   async function getAccessToken() {
     const auth = new GoogleAuth({
       credentials: {
         client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
         private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
       },
       scopes: ['https://www.googleapis.com/auth/drive'],
     })
     const client = await auth.getClient()
     const token = await client.getAccessToken()
     return token.token!
   }
   ```

When a new team is created, a Google Drive folder is automatically created under your root folder.

---

## Google Forms Integration

For evaluation forms and student intake:

1. Create a Google Form (evaluation scorecard, student onboarding, etc.)
2. In the Form → Responses → Link to Sheets
3. Add a Google Apps Script trigger to POST responses to your API:
   ```js
   function onFormSubmit(e) {
     const payload = {
       teamId: e.values[1],
       phase: e.values[2],
       // ... map form fields
     }
     UrlFetchApp.fetch('https://dvl.ifhe.edu.in/api/evaluations', {
       method: 'POST',
       contentType: 'application/json',
       payload: JSON.stringify(payload),
       headers: { 'x-api-key': 'YOUR_API_KEY' }
     })
   }
   ```

---

## Database Management

```bash
# View database in browser
npm run db:studio

# Create a new migration after schema changes
npx prisma migrate dev --name describe_your_change

# Reset database (development only)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

---

## Project Structure

```
dvl-dashboard/
├── app/
│   ├── (auth)/              # Login, verify pages
│   ├── (student)/           # Student portal pages
│   ├── (faculty)/           # Faculty portal pages
│   ├── (admin)/             # Admin panel pages
│   └── api/                 # API routes
├── components/
│   ├── layout/              # Sidebar, PageHeader
│   ├── student/             # Student-specific components
│   ├── faculty/             # Faculty-specific components
│   └── admin/               # Admin-specific components
├── lib/
│   ├── prisma.ts            # Database client
│   ├── utils.ts             # Shared utilities
│   └── google-drive.ts      # Google Drive integration
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data
├── types/
│   └── next-auth.d.ts       # Type augmentations
├── deploy/
│   ├── nginx.conf           # Production Nginx config
│   └── setup-vps.sh         # One-shot VPS bootstrap
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions CI/CD
├── auth.ts                  # NextAuth configuration
├── middleware.ts            # Route protection + RBAC
└── ecosystem.config.js      # PM2 process config
```

---

## Support

Built for the Digital Ventures Lab, CDOE, IFHE Hyderabad.
