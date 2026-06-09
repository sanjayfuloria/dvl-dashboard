import { getSession } from '@/lib/session'
import { PageHeader } from '@/components/layout/PageHeader'
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
        { label: 'Auth method', value: 'Magic link (passwordless)' },
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
      title: 'Application',
      description: 'General application configuration.',
      items: [
        { label: 'Base URL', value: process.env.NEXTAUTH_URL ?? 'Not configured' },
        { label: 'Environment', value: process.env.NODE_ENV ?? 'development' },
        { label: 'Google Drive', value: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ? '✅ Configured' : '⚠️ Not configured' },
      ],
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Auth and session configuration.',
      items: [
        { label: 'Session strategy', value: 'Database sessions (30 day expiry)' },
        { label: 'Auth secret', value: process.env.AUTH_SECRET ? '✅ Set' : '❌ Missing' },
        { label: 'RBAC', value: 'Middleware-enforced role-based access' },
      ],
    },
  ]

  return (
    <div className="page-enter">
      <PageHeader title="Settings" subtitle="System configuration and environment status" />
      <div className="page-body space-y-5">
        <div className="card p-4 flex items-center gap-3 border-2" style={{ borderColor: 'var(--dvl-amber)', background: '#fffbeb' }}>
          <Settings className="w-4 h-4 text-amber-700 shrink-0" />
          <p className="text-sm text-amber-800">
            Configuration is managed via environment variables on the VPS. Edit <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">/var/www/dvl-dashboard/.env</code> and restart PM2 to apply changes.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'var(--dvl-purple-dim)' }}>
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
      </div>
    </div>
  )
}
