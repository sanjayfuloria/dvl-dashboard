import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, phaseColor, phaseLabel, statusColor } from '@/lib/utils'
import { CheckSquare } from 'lucide-react'

export const metadata = { title: 'Milestones' }

export default async function AdminMilestonesPage() {
  const milestones = await prisma.milestone.findMany({
    include: { team: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="page-enter">
      <PageHeader title="Milestones" subtitle={`${milestones.length} milestones across all teams`} />
      <div className="page-body">
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Team</th>
                <th>Phase</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.title}</td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.team.name}</td>
                  <td>
                    <span className={`phase-badge ${phaseColor(m.phase)} text-xs`}>
                      {phaseLabel(m.phase)}
                    </span>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(m.dueDate)}
                  </td>
                  <td>
                    <span className={`tag text-xs ${statusColor(m.status)}`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {milestones.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    No milestones yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
