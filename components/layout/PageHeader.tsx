import { Bell } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="flex-1 min-w-0">
        <h1 className="text-base md:text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && (
          <p className="text-xs md:text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <button className="relative p-2 rounded-lg transition-colors btn-ghost">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
