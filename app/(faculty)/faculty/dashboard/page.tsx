import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, healthColor, healthLabel, formatDate } from '@/lib/utils'
import { Users, CheckSquare, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Faculty Dashboard' }

async function getFacultyData(userId: string) {
  const profile = await prisma.facultyProfile.findUnique({
    where: { userId },
    include: {
      assignedTeams: {
        include: {
          members: { include: { student: { include: { user: true } } } },
          milestones: { orderBy: { dueDate: 'asc' } },
          deliverables: true,
          evaluations: true,
          mentor: { include: { user: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
  return profile
}

export default async function FacultyDashboard() {
  const session = await getSession()
  if (!session?.id) return null
  const profile = await getFacultyData(session.id)
  const teams = profile?.assignedTeams ?? []

  const pendingReviews = teams.flatMap((t) =>
    t.deliverables.filter((d) => d.status === 'SUBMITTED')
  ).length
  const atRisk = teams.filter((t) => t.health === 'AT_RISK').length

  return (
    <div className="page-enter">
      <PageHeader
        title={`Faculty Dashboard`}
        subtitle={`${teams.length} teams assigned to you`}
        actions={
          <Link href="/faculty/evaluations" className="btn-primary">
            <CheckSquare className="w-4 h-4" /> Evaluations
          </Link>
        }
      />
      <div className="page-body space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Teams assigned', value: teams.length, color: 'var(--dvl-purple)' },
            { label: 'Total students', value: teams.reduce((a, t) => a + t.members.length, 0), color: 'var(--dvl-teal)' },
            { label: 'Pending reviews', value: pendingReviews, color: 'var(--dvl-amber)' },
            { label: 'At-risk teams', value: atRisk, color: '#ef4444' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="text-3xl font-semibold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Teams table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>My teams</h3>
            <Link href="/faculty/teams" className="text-xs text-brand hover:underline">All teams →</Link>
          </div>
          {teams.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venture</th>
                  <th>Course</th>
                  <th>Phase</th>
                  <th>Health</th>
                  <th>Progress</th>
                  <th>Members</th>
                  <th>Pending</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const pending = team.deliverables.filter((d) => d.status === 'SUBMITTED').length
                  return (
                    <tr key={team.id}>
                      <td>
                        <p className="font-medium">{team.ventureName ?? team.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.name}</p>
                      </td>
                      <td><span className="tag-gray tag">{team.course}</span></td>
                      <td><span className={`phase-badge ${phaseColor(team.currentPhase)} text-xs`}>{phaseLabel(team.currentPhase)}</span></td>
                      <td>
                        <span className={`text-sm font-medium ${healthColor(team.health)}`}>
                          {healthLabel(team.health)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-20">
                            <div className="progress-fill" style={{ width: `${team.progressPct}%` }} />
                          </div>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.progressPct}%</span>
                        </div>
                      </td>
                      <td className="text-sm">{team.members.length}</td>
                      <td>
                        {pending > 0 && (
                          <span className="tag-amber tag">{pending} pending</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/faculty/teams/${team.id}`} className="btn-ghost text-xs px-2 py-1">
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-base font-medium">No teams assigned yet</p>
              <p className="text-sm mt-1">Contact the administrator to get teams assigned</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
