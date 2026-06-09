# DVL Dashboard
### Digital Venture Lab — ICFAI Foundation for Higher Education (IFHE), Hyderabad

Complete operating system for the Digital Venture Lab at IFHE. Manages the full student venture lifecycle from idea validation through prototype to MVP.

**Live URL:** https://www.sanjayfuloria.tech/dvl  
**Repository:** https://github.com/sanjayfuloria/dvl-dashboard

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| Admin | sanjay.fuloria@ibsindia.org | Admin@DVL2025 |
| Admin | admin@dvl.ifhe.edu.in | Admin@DVL2025 |
| Faculty | faculty@ifhe.edu.in | Faculty@DVL2025 |
| Mentor | mentor@example.com | Mentor@DVL2025 |
| Student | student@ifhe.edu.in | Student@DVL2025 |

Login URL: https://www.sanjayfuloria.tech/dvl/login

After first login, change your password via Sidebar > Change Password.

---

## Demo Data Pre-loaded

- Team: Team Alpha | Venture: AgriConnect
- Course: MPB (Managing Platform Businesses) | Sector: AgriTech
- Phase: Prototype | Progress: 45%
- Faculty Guide: Dr. Sample Faculty
- Industry Mentor: Rajesh Kumar (TechVentures India)
- Student: Priya Sharma (student@ifhe.edu.in)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3.3 (App Router, TypeScript) |
| Database | PostgreSQL 14 + Prisma ORM 5.x |
| Authentication | Custom JWT (jose) — email + password, HttpOnly cookie |
| Styling | Tailwind CSS + custom design tokens |
| Email | Resend (noreply@sanjayfuloria.tech) |
| File Storage | Google Drive API (service account) |
| Deployment | Hostinger VPS + Nginx + PM2 |
| CI/CD | GitHub Actions (auto-deploy on push to main) |

---

## Features by Role

### Student Portal
- Home dashboard — venture summary, milestones, AI activity, quick actions
- Project Profile — venture details, team members, faculty guide, mentor
- Milestones — phase-by-phase tracker with deliverable file uploads to Google Drive
- AI Build Log — document every AI tool used (tool, purpose, prompt, output, time saved)
- Monthly Reflections — structured 7-question learning journal
- Knowledge Hub — resources, templates, frameworks, prompt libraries
- Portfolio — placement-ready profile of the DVL journey
- Change Password

### Faculty Portal
- Dashboard — all assigned teams, pending reviews, at-risk flags
- Teams — detail view with milestones, deliverables, AI logs, reflections
- Evaluation Panel — score teams on phase rubric (1-10 per criterion)

### Mentor Portal
- Dashboard — assigned teams summary and status
- Teams — project status, reflections, milestones
- Sessions — log mentor meetings with notes

### Admin Panel
- Dashboard — programme health: users, teams, phases, AI adoption
- Users — add users, set passwords, change roles, bulk import via CSV
- Teams — create teams, assign faculty/mentor/students; auto-creates Google Drive folder
- Milestones — all milestones across all teams
- Resources — knowledge repository management
- Analytics — charts: phase distribution, AI tool usage, evaluation scores
- Demo Day — showcase all MVP-stage ventures
- Settings — system configuration and integration status

---

## Key Integrations

### Google Drive
- Team folder + 5 subfolders auto-created when team is created
- Subfolders: Deliverables / Meeting Notes / Prototypes / Research / Presentations
- Students upload files from Milestones page directly to the right subfolder
- Root folder: https://drive.google.com/drive/folders/1M-iKZO60pA4GfwNyLULPy6W7Ad-B_LYm
- Service account: dvl-service@dvl-dashboard.iam.gserviceaccount.com

### Resend Email
- Welcome email on user creation (includes login URL + password)
- Role change notification with special admin promotion message
- Verified sending domain: sanjayfuloria.tech

### Bulk User Import
- Upload CSV with columns: name, email, role, password
- Password auto-generated if blank
- Welcome emails sent to all imported users if checkbox selected

CSV format example:
  name,email,role,password
  Priya Sharma,priya@ifhe.edu.in,STUDENT,
  Dr. Anita Verma,anita@ifhe.edu.in,FACULTY,
  Rajesh Mehta,rajesh@company.com,MENTOR,MyPass123

---

## Database Models (18 total)

User, UserPassword, StudentProfile, FacultyProfile, MentorProfile,
Team, TeamMember, Milestone, Deliverable, Evaluation, AIBuildLog,
Reflection, ReflectionComment, MentorSession, Resource,
DemoShowcase, WorkspaceFile, Notification

---

## Authentication

- Session: JWT in dvl_session cookie (30-day, HttpOnly, Secure, SameSite=Lax)
- Passwords: bcrypt 12 rounds
- Route protection: Next.js Edge middleware (jose JWT verify)
- Role redirects after login:
  - ADMIN  -> /dvl/admin/dashboard
  - FACULTY -> /dvl/faculty/dashboard
  - MENTOR  -> /dvl/mentor/dashboard
  - STUDENT -> /dvl/dashboard

---

## Local Development

Requirements: Node.js 20+, PostgreSQL 14+

  git clone https://github.com/sanjayfuloria/dvl-dashboard.git
  cd dvl-dashboard
  npm install
  cp .env.example .env   # fill in values
  npx prisma migrate dev --name init
  npx prisma generate
  npm run db:seed
  npm run dev
  # Opens at http://localhost:3000/dvl/login

Environment variables needed in .env:
  DATABASE_URL
  AUTH_SECRET          (openssl rand -hex 32)
  NEXTAUTH_URL         (http://localhost:3000/dvl for dev)
  AUTH_TRUST_HOST      (true)
  RESEND_API_KEY
  EMAIL_FROM
  GOOGLE_SERVICE_ACCOUNT_EMAIL
  GOOGLE_SERVICE_ACCOUNT_KEY
  GOOGLE_DRIVE_ROOT_FOLDER_ID
  NODE_ENV

---

## Production Server

| Item | Value |
|---|---|
| Provider | Hostinger VPS |
| IP | 187.127.167.139 |
| OS | Ubuntu 22.04 LTS |
| Node.js | 20.x |
| App path | /var/www/dvl-dashboard |
| App port | 3001 (proxied by Nginx at /dvl) |
| PM2 app | dvl-dashboard (id: 4) |
| Nginx config | /etc/nginx/sites-available/sanjayfuloria.tech |
| PM2 logs | /root/.pm2/logs/dvl-dashboard-*.log |

### Manual deploy commands

  ssh root@187.127.167.139
  cd /var/www/dvl-dashboard
  git pull origin main
  npm install
  npx prisma migrate deploy
  npx prisma generate
  npm run build
  pm2 restart dvl-dashboard --update-env

### Useful PM2 commands

  pm2 status
  pm2 logs dvl-dashboard --lines 50
  pm2 restart dvl-dashboard --update-env
  pm2 stop dvl-dashboard

### Useful database commands

  npx prisma studio          # Visual DB browser (dev)
  npx prisma migrate deploy  # Deploy migrations (production)
  npm run db:seed            # Re-seed demo data

---

## Google Drive Setup Reference

1. Google Cloud project: DVL Dashboard
2. APIs enabled: Google Drive API, Google Sheets API
3. Service account JSON: /var/www/dvl-dashboard/dvl-dashboard-2ab45998367c.json (NOT in git)
4. Root folder ID: 1M-iKZO60pA4GfwNyLULPy6W7Ad-B_LYm
5. Root folder shared with service account as Editor

---

## Project Structure

  app/
    (auth)/login/              Login page
    (auth)/change-password/    Change password
    (student)/dashboard/       Student home
    (student)/milestones/      Milestones + file uploads
    (student)/ai-log/          AI Build Log
    (student)/reflections/     Monthly reflections
    (student)/resources/       Knowledge Hub
    (student)/portfolio/       Placement portfolio
    (faculty)/faculty/         Faculty portal pages
    (admin)/admin/             Admin portal pages
    mentor/                    Mentor portal pages
    api/login/                 JWT login endpoint
    api/logout/                Session logout
    api/upload/                File upload to Drive
    api/teams/                 Team CRUD
    api/admin/users/           User management endpoints
  components/
    layout/Sidebar.tsx         Role-aware navigation
    admin/                     Admin UI components
    student/                   Student UI components
    shared/FileUpload.tsx      Drag-drop Drive upload
  lib/
    session.ts                 JWT session management
    google-drive.ts            Google Drive API
    prisma.ts                  Prisma client
  prisma/
    schema.prisma              18-model database schema
    seed.ts                    Demo data seeder
  middleware.ts                Route protection

---

## Planned Enhancements

1. AI Venture Co-pilot (Claude API) — customer discovery, BMC filling, market sizing
2. In-platform messaging — direct messages between students, faculty, mentors
3. Automated milestone reminders — email 7 days and 1 day before deadlines
4. Public showcase page — public URL per team for Demo Day and placement
5. LinkedIn export — one-click DVL portfolio as PDF or LinkedIn post
6. Jury portal — temporary Demo Day judge logins with auto-tallied scores
7. Cohort management — multiple batches (2024-26, 2025-27) with separate timelines
8. Announcement board — programme-wide notices from admin/faculty

---

## Project Owner

Digital Ventures Lab
Center for Distance and Online Education (CDOE)
ICFAI Foundation for Higher Education (IFHE), Hyderabad

Director, CDOE: Prof. Sanjay Fuloria
Platform: https://www.sanjayfuloria.tech/dvl
Repository: https://github.com/sanjayfuloria/dvl-dashboard
