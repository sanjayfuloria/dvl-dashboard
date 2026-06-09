import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, formatDate } from '@/lib/utils'
import { Users, Calendar, FileText, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Mentor Dashboard' }

async function getMentorData(userId: string) {
  return prisma.mentorProfile.findUnique({
    where: { userId },
    include: {
      assignedTeams: {
        include: {
          members: { include: { student: { include: { user: true } } } },
          milestones: { orderBy: { dueDate: 'asc' }, take: 3 },
          reflections: { orderBy: { submittedAt: 'desc' }, take: 1 },
        },
      },
      sessions: {
        orderBy: { meetingDate: 'desc' },
        take: 5,
        include: { team: true },
      },
    },
  })
}

export default async function MentorDashboard() {
  const session = await auth()
  if (!session?.user?.id) return null
  const profile = await getMentorData(session.user.id)
  const teams = profile?.assignedTeams ?? []

  return (
    <div className="page-enter">
      <PageHeader
        title="Mentor Dashboard"
        subtitle={`${teams.length} teams assigned`}
      />
      <div className="page-body space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-3xl font-semibold">{teams.length}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Teams assigned</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-semibold">{profile?.sessions.length ?? 0}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sessions recorded</p>
          </div>
          <div className="stat-card">
            <p className="text-3xl font-semibold">{teams.reduce((a, t) => a + t.members.length, 0)}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Total students</p>
          </div>
        </div>

        {/* Teams */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> My teams</h3>
          {teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team.id} className="p-4 rounded-xl border flex items-start justify-between gap-4"
                     style={{ borderColor: 'var(--border)' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{team.ventureName ?? team.name}</p>
                      <span className={`phase-badge ${phaseColor(team.currentPhase)} text-xs`}>
                        {phaseLabel(team.currentPhase)}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {team.name} · {team.course} · {team.members.length} members
                    </p>
                    {team.reflections[0] && (
                      <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                        Latest reflection: {team.reflections[0].month}
                      </p>
                    )}
                  </div>
                  <Link href={`/mentor/teams/${team.id}`} className="btn-ghost text-xs shrink-0">
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No teams assigned yet</p>
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Recent sessions</h3>
            <Link href="/mentor/sessions" className="text-xs text-brand hover:underline flex items-center gap-1">
              All sessions <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {(profile?.sessions.length ?? 0) > 0 ? (
            <div className="space-y-3">
              {profile!.sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg"
                     style={{ background: 'var(--surface-raised)' }}>
                  <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.team.ventureName ?? s.team.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(s.meetingDate)}
                    </p>
                  </div>
                  {s.summary && (
                    <p className="text-xs max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {s.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-8">
              <Calendar className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No sessions recorded yet</p>
              <Link href="/mentor/sessions" className="mt-3 btn-primary text-xs">Log a session</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
