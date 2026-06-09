import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, healthColor, healthLabel } from '@/lib/utils'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const metadata = { title: 'My Teams' }

export default async function FacultyTeamsPage() {
  const session = await getSession()
  if (!session?.id) return null

  const profile = await prisma.facultyProfile.findUnique({
    where: { userId: session.id },
    include: {
      assignedTeams: {
        include: {
          members: { include: { student: { include: { user: true } } } },
          milestones: true,
          deliverables: true,
          mentor: { include: { user: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  const teams = profile?.assignedTeams ?? []

  return (
    <div className="page-enter">
      <PageHeader title="My Teams" subtitle={`${teams.length} teams assigned to you`} />
      <div className="page-body space-y-4">
        {teams.map((team) => {
          const pending = team.deliverables.filter(d => d.status === 'SUBMITTED').length
          const approved = team.milestones.filter(m => m.status === 'APPROVED').length
          return (
            <div key={team.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold">{team.ventureName ?? team.name}</h3>
                    <span className={`phase-badge ${phaseColor(team.currentPhase)} text-xs`}>
                      {phaseLabel(team.currentPhase)}
                    </span>
                    <span className={`text-xs font-medium ${healthColor(team.health)}`}>
                      {healthLabel(team.health)}
                    </span>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {team.name} · {team.course} {team.sector ? `· ${team.sector}` : ''}
                    {team.mentor ? ` · Mentor: ${team.mentor.user.name}` : ''}
                  </p>

                  {/* Members */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {team.members.map((m) => (
                      <div key={m.id} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                           style={{ background: 'var(--dvl-indigo)' }} title={m.student.user.name ?? ''}>
                        {m.student.user.name?.charAt(0) ?? '?'}
                      </div>
                    ))}
                    <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                      {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="progress-bar w-32">
                      <div className="progress-fill" style={{ width: `${team.progressPct}%` }} />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.progressPct}% complete</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{approved} milestones approved</span>
                    {pending > 0 && (
                      <span className="tag-amber tag text-xs">{pending} pending review</span>
                    )}
                  </div>
                </div>
                <Link href={`/faculty/teams/${team.id}`} className="btn-secondary text-sm ml-4 shrink-0">
                  View team <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
        {teams.length === 0 && (
          <div className="card text-center py-20">
            <p className="text-base font-medium mb-2">No teams assigned yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Contact the administrator to have teams assigned to you.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
