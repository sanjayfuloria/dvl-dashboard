import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, healthLabel, healthColor, formatDate, formatDateShort } from '@/lib/utils'
import {
  Rocket, CheckSquare, Bot, Star, TrendingUp, Calendar,
  Users, AlertCircle, Clock, ChevronRight, Zap
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

async function getStudentData(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              milestones: { orderBy: { dueDate: 'asc' }, take: 5 },
              deliverables: true,
              evaluations: { orderBy: { createdAt: 'desc' }, take: 3 },
              mentor: { include: { user: true } },
              facultyGuide: { include: { user: true } },
              aiLogs: { orderBy: { loggedAt: 'desc' }, take: 3 },
              members: { include: { student: { include: { user: true } } } },
            },
          },
        },
        take: 1,
      },
    },
  })
  return student
}

export default async function StudentDashboard() {
  const session = await getSession()
  if (!session?.id) return null

  const student = await getStudentData(session.id)
  const team = student?.teamMembers?.[0]?.team

  const upcomingMilestones = team?.milestones.filter(
    (m) => m.status !== 'APPROVED' && m.dueDate && new Date(m.dueDate) >= new Date()
  ) ?? []

  const completedMilestones = team?.milestones.filter((m) => m.status === 'APPROVED').length ?? 0
  const totalMilestones = team?.milestones.length ?? 0

  return (
    <div className="page-enter">
      <PageHeader
        title={`Welcome back, ${session.name?.split(' ')[0] ?? 'Student'}`}
        subtitle="Here's what's happening with your venture"
      />

      <div className="page-body space-y-6">
        {team ? (
          <>
            {/* Venture summary card */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: 'var(--dvl-purple-dim)' }}>
                    <Rocket className="w-5 h-5" style={{ color: 'var(--dvl-purple)' }} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{team.ventureName ?? team.name}</h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {team.name} · {team.course}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`phase-badge ${phaseColor(team.currentPhase)}`}>
                    {phaseLabel(team.currentPhase)}
                  </span>
                  <span className={`text-sm font-medium ${healthColor(team.health)}`}>
                    {healthLabel(team.health)}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--text-secondary)' }}>Overall progress</span>
                  <span className="font-medium">{team.progressPct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${team.progressPct}%` }} />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-center">
                  <p className="text-2xl font-semibold">{completedMilestones}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Milestones done</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold">{team.deliverables.filter(d => d.status === 'APPROVED').length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Deliverables approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold">{team.aiLogs.length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI log entries</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold">{team.members.length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Team members</p>
                </div>
              </div>
            </div>

            {/* Two column layout */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Upcoming milestones + AI log */}
              <div className="col-span-2 space-y-5">
                {/* Upcoming milestones */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" style={{ color: 'var(--dvl-purple)' }} />
                      Upcoming milestones
                    </h3>
                    <Link href="/milestones" className="text-xs text-brand hover:underline flex items-center gap-1">
                      View all <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {upcomingMilestones.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingMilestones.slice(0, 4).map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg"
                             style={{ background: 'var(--surface-raised)' }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                               style={{ background: 'var(--dvl-purple-dim)' }}>
                            <Clock className="w-3.5 h-3.5" style={{ color: 'var(--dvl-purple)' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{m.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {m.dueDate ? `Due ${formatDateShort(m.dueDate)}` : 'No due date'}
                            </p>
                          </div>
                          <span className={`tag text-xs ${m.status === 'IN_PROGRESS' ? 'tag-purple' : 'tag-gray'}`}>
                            {m.status.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state py-8">
                      <CheckSquare className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No upcoming milestones</p>
                    </div>
                  )}
                </div>

                {/* Recent AI logs */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2">
                      <Bot className="w-4 h-4" style={{ color: 'var(--dvl-teal)' }} />
                      Recent AI activity
                    </h3>
                    <Link href="/ai-log" className="text-xs text-brand hover:underline flex items-center gap-1">
                      Full log <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {team.aiLogs.length > 0 ? (
                    <div className="space-y-3">
                      {team.aiLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3">
                          <span className="tag-teal tag mt-0.5">{log.toolUsed}</span>
                          <div>
                            <p className="text-sm">{log.activity}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(log.loggedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state py-8">
                      <Bot className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No AI log entries yet</p>
                      <Link href="/ai-log" className="mt-3 btn-primary text-xs">Log AI usage</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Guides + team */}
              <div className="space-y-5">
                {/* Faculty & Mentor */}
                <div className="card">
                  <h3 className="mb-4">Your guides</h3>
                  <div className="space-y-3">
                    {team.facultyGuide && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                             style={{ background: 'var(--dvl-purple)' }}>
                          {team.facultyGuide.user.name?.charAt(0) ?? 'F'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{team.facultyGuide.user.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Faculty Guide</p>
                        </div>
                      </div>
                    )}
                    {team.mentor && (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                             style={{ background: 'var(--dvl-teal)' }}>
                          {team.mentor.user.name?.charAt(0) ?? 'M'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{team.mentor.user.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Industry Mentor</p>
                        </div>
                      </div>
                    )}
                    {!team.facultyGuide && !team.mentor && (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No guides assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Team members */}
                <div className="card">
                  <h3 className="mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team ({team.members.length})
                  </h3>
                  <div className="space-y-2">
                    {team.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                             style={{ background: 'var(--dvl-indigo)' }}>
                          {m.student.user.name?.charAt(0) ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{m.student.user.name}</p>
                        </div>
                        {m.role && (
                          <span className="tag-gray tag text-[10px]">{m.role}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick links */}
                <div className="card">
                  <h3 className="mb-4">Quick actions</h3>
                  <div className="space-y-2">
                    {[
                      { href: '/milestones', label: 'Submit deliverable', icon: CheckSquare },
                      { href: '/ai-log', label: 'Log AI usage', icon: Bot },
                      { href: '/reflections', label: 'Monthly reflection', icon: TrendingUp },
                      { href: '/portfolio', label: 'View portfolio', icon: Star },
                    ].map((action) => (
                      <Link key={action.href} href={action.href}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-raised)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <action.icon className="w-4 h-4" />
                        {action.label}
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // No team yet
          <div className="card text-center py-20">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                 style={{ background: 'var(--dvl-purple-dim)' }}>
              <Rocket className="w-8 h-8" style={{ color: 'var(--dvl-purple)' }} />
            </div>
            <h2 className="text-lg font-semibold mb-2">You're not in a team yet</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>
              Your faculty will add you to a DVL team. Once added, you'll see your venture dashboard here.
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <AlertCircle className="w-4 h-4" />
                Contact your faculty guide to get started
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
