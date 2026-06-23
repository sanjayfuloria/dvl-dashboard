import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { DangerZone } from '@/components/admin/DangerZone'
import { Settings, Mail, Database, Shield, Globe } from 'lucide-react'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null

  const sections = [
    {
      icon: Mail,
      title: 'Email (Resend)',
      description: 'Authentication emails and notifications are sent via Resend.',
      items: [
        { label: 'From address', value: process.env.EMAIL_FROM ?? 'Not configured' },
        { label: 'Service', value: 'Resend' },
      ],
    },
    {
      icon: Database,
      title: 'Database',
      description: 'PostgreSQL database running on the Hostinger VPS.',
      items: [
        { label: 'ORM', value: 'Prisma' },
        { label: 'Connection', value: process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured' },
      ],
    },
    {
      icon: Globe,
      title: 'Google Drive',
      description: 'Team folders and deliverables are stored in Google Drive via a service account.',
      items: [
        { label: 'Service account', value: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? 'Not configured' },
        { label: 'Root folder', value: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ? '✅ Configured' : '❌ Not configured' },
      ],
    },
    {
      icon: Shield,
      title: 'Authentication',
      description: 'Custom JWT authentication with HttpOnly cookies.',
      items: [
        { label: 'Method', value: 'Custom JWT (jose + bcryptjs)' },
        { label: 'Session', value: 'HttpOnly cookie (dvl_session)' },
        { label: 'JWT secret', value: process.env.JWT_SECRET ? '✅ Configured' : '❌ Not configured' },
      ],
    },
    {
      icon: Settings,
      title: 'Platform',
      description: 'DVL Dashboard deployment details.',
      items: [
        { label: 'Framework', value: 'Next.js 15 (App Router)' },
        { label: 'Base URL', value: process.env.NEXT_PUBLIC_BASE_URL ?? 'Not configured' },
        { label: 'Environment', value: process.env.NODE_ENV ?? 'development' },
      ],
    },
  ]

  return (
    <div className="page-enter">
      <PageHeader title="Settings" subtitle="Platform configuration and system status" />
      <div className="page-body space-y-4">
        <div className="card" style={{ background: 'var(--dvl-purple-dim)', border: '1px solid var(--dvl-purple-dim)' }}>
          <p className="text-sm" style={{ color: 'var(--dvl-purple)' }}>
            Configuration is managed via environment variables in
            <code className="mx-1 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(91,75,212,0.15)' }}>/var/www/dvl-dashboard/.env</code>
            Restart PM2 to apply any changes.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--dvl-purple-dim)' }}>
                <section.icon className="w-4 h-4" style={{ color: 'var(--dvl-purple)' }} />
              </div>
              <div>
                <h3>{section.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{section.description}</p>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {section.items.map(item => (
                <div key={item.label} className="flex justify-between py-2.5 text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="font-medium font-mono text-xs">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <DangerZone />
      </div>
    </div>
  )
}
