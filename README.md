# DVL Dashboard — Digital Venture Lab Operating System

> The internal operating system for the **Digital Venture Lab** at ICFAI Foundation for Higher Education (IFHE), Hyderabad. Built and maintained by **Prof. Sanjay Fuloria**, Director, Centre for Distance and Online Education (CDOE).

---

## Overview

DVL Dashboard is a production-grade, multi-role platform that manages the full lifecycle of student venture projects — from team formation and milestone tracking to deliverable submission, faculty review, and Demo Day. It replaces spreadsheets, email chains, and manual tracking with a single unified interface for admins, faculty, and students.

**Live at:** \`https://www.sanjayfuloria.tech/dvl\`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | Custom JWT (\`jose\` + \`bcryptjs\`) |
| Email | Resend (transactional + bulk) |
| Storage | Google Drive API (service account) |
| Styling | Tailwind CSS |
| Server | Ubuntu 22.04, Nginx, PM2 |
| Hosting | Hostinger VPS |

---

## Architecture

\`\`\`
sanjayfuloria.tech          → Static portfolio (Nginx)
sanjayfuloria.tech/dvl      → DVL Dashboard (Next.js, PM2 port 3001)
sanjayfuloria.tech/dvl-docs → Knowledge resource HTML pages (Nginx static)
\`\`\`

**PM2 processes:**
- \`dvl-dashboard\` — port 3001
- \`accrediq\` — port 3000
- \`projectflow-api\` — port 4000

**Database:** PostgreSQL (\`dvl_dashboard\` DB, user \`dvl_user\`)

---

## Features

### Multi-Role Access

| Role | Access |
|---|---|
| **Admin** | Full platform control — users, teams, analytics, settings |
| **Faculty** | Assigned teams — view progress, review deliverables, submit evaluations |
| **Student** | Own team — milestones, deliverables, AI log, reflections, resources |

### Student Cohort — AY 2026-27, Sem 3

| Section | Course | Students |
|---|---|---|
| MDT-A | Managing Digital Transformation | 47 |
| MPB-A | Marketing for Platform Businesses | 42 |
| MPB-B | Marketing for Platform Businesses | 24 |
| B2B-B | Business-to-Business Marketing | 52 |
| **Total** | | **165** |

### Team Formation
- Students self-select: Create a team, Join a team, or Go individual
- Scope toggle: within own section or cross-section
- Max 5 members per team
- Admin/faculty can assign or reassign any student to any team
- Google Drive folder auto-created on team creation (5 subfolders)

### Milestone & Deliverable System

**Phase structure:**
- Phase 1 — Ideation: Problem Brief, BMC, Customer Discovery Report, Opportunity Assessment
- Phase 2 — Prototype: Functional Prototype, Product Specification, User Feedback Summary
- Phase 3 — MVP: MVP Demonstration, Pitch Deck, Final Report, Growth Roadmap

**Submission → Review loop:**
1. Student uploads file → Google Drive team folder
2. Deliverable record created with status SUBMITTED
3. Faculty guide notified in-app
4. Faculty reviews in Drive, adds feedback, Approve / Request Revision / Reject
5. Student gets notification and sees feedback inline on Milestones page

### Google Drive Integration
\`\`\`
[Root Folder]/
└── [Venture Name] — [Team Name]/
    ├── Deliverables/
    ├── Presentations/
    ├── Prototypes/
    ├── Meeting Notes/
    └── Research/
\`\`\`

### Knowledge Repository

| Resource | URL |
|---|---|
| Business Model Canvas Template | /dvl-docs/bmc.html |
| Customer Discovery Interview Guide | /dvl-docs/customer-discovery.html |
| AI Prompt Library for Product Managers | /dvl-docs/ai-prompts.html |
| Digital Transformation Framework | /dvl-docs/digital-transformation.html |

---

## Project Structure

\`\`\`
app/
├── (admin)/admin/
│   ├── students/           # Roster + team assignment
│   ├── teams/[teamId]/     # Full team detail
│   ├── analytics/
│   ├── resources/
│   └── users/              # Bulk import
├── (faculty)/faculty/
│   └── teams/[teamId]/     # DeliverableReview + EvaluationPanel
├── (student)/
│   ├── team/               # Team selection
│   ├── milestones/         # Upload + feedback view
│   ├── ai-log/
│   ├── reflections/
│   ├── resources/
│   └── venture/
└── api/
    ├── admin/students/     # GET roster, POST assign
    ├── deliverables/review/ # POST approve/reject
    ├── student/teams/      # Browse/create/join/leave
    ├── upload/             # File → Drive → Deliverable
    ├── evaluations/
    └── auth/

components/
├── faculty/
│   ├── DeliverableReview.tsx
│   └── EvaluationPanel.tsx
├── shared/FileUpload.tsx
└── layout/

lib/
├── session.ts
├── prisma.ts
├── google-drive.ts
└── utils.ts
\`\`\`

---

## Environment Variables

\`\`\`env
DATABASE_URL="postgresql://dvl_user:PASSWORD@localhost:5432/dvl_dashboard"
JWT_SECRET="..."
RESEND_API_KEY="re_..."
EMAIL_FROM="DVL Dashboard <noreply@sanjayfuloria.tech>"
GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID="..."
NEXT_PUBLIC_BASE_URL="https://www.sanjayfuloria.tech/dvl"
\`\`\`

> .env and Google credentials are gitignored. Never commit credentials.

---

## Deployment

\`\`\`bash
git clone https://github.com/sanjayfuloria/dvl-dashboard.git
cd dvl-dashboard
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 start ecosystem.config.js
\`\`\`

### Deploy updates
\`\`\`bash
cd /var/www/dvl-dashboard
git pull && npm install
npx prisma generate
npm run build
pm2 restart dvl-dashboard
\`\`\`

---

## Key Design Decisions

- **Custom JWT auth** — NextAuth v5 abandoned due to Edge runtime incompatibility. Uses \`jose\` + \`bcryptjs\`.
- **React Portal pattern** — all modals use \`createPortal\` to prevent SSR issues and layout clipping.
- **Nginx location ordering** — \`/dvl-docs\` declared with \`^~\` before \`/dvl\` proxy block.
- **Prisma client regeneration** — always run \`prisma generate\` after schema changes before building.

---

## Roadmap

- [ ] Milestone deadlines with automated reminder notifications
- [ ] Cohort health dashboard — teams at risk flag
- [ ] Demo Day module — jury assignment, slot scheduling, live scoring
- [ ] Mentor session self-logging
- [ ] CSV/Excel export for reporting
- [ ] Public Demo Day showcase page

---

## Author

**Prof. Sanjay Fuloria**
Director, CDOE | IFHE Hyderabad
[sanjay.fuloria@ibsindia.org](mailto:sanjay.fuloria@ibsindia.org)

*Every feature in this repo is live in production at https://www.sanjayfuloria.tech/dvl*
