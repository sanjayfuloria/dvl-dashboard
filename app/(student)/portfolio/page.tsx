import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, phaseLabel } from '@/lib/utils'
import { Star, Download, ExternalLink, Briefcase, Bot, Trophy, Users, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Portfolio' }

async function getPortfolioData(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      teamMembers: {
        include: {
          team: {
            include: {
              milestones: true,
              deliverables: true,
              evaluations: true,
              aiLogs: true,
              mentorSessions: true,
              demoDay: true,
              facultyGuide: { include: { user: true } },
              mentor: { include: { user: true } },
            },
          },
        },
      },
    },
  })
  return student
}

export default async function PortfolioPage() {
  const session = await getSession()
  if (!session?.id) return null
  const student = await getPortfolioData(session.id)
  const teams = student?.teamMembers.map((m) => m.team) ?? []

  const totalAILogs = teams.reduce((a, t) => a + t.aiLogs.length, 0)
  const aiTools = [...new Set(teams.flatMap((t) => t.aiLogs.map((l) => l.toolUsed)))]
  const approvedDeliverables = teams.reduce((a, t) => a + t.deliverables.filter((d) => d.status === 'APPROVED').length, 0)
  const totalSessions = teams.reduce((a, t) => a + t.mentorSessions.length, 0)
  const avgScore = (() => {
    const scores = teams.flatMap((t) => t.evaluations.map((e) => e.totalScore).filter(Boolean) as number[])
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null
  })()

  return (
    <div className="page-enter">
      <PageHeader
        title="My Portfolio"
        subtitle="Your DVL placement-ready profile"
        actions={
          <button className="btn-secondary">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        }
      />

      <div className="page-body space-y-6">
        {/* Header */}
        <div className="card flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
               style={{ background: 'var(--dvl-purple)' }}>
            {session.name?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{session.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{session.email}</p>
            {student?.programme && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {student.programme} · Batch {student.batch} · Roll {student.rollNumber}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {aiTools.slice(0, 6).map(t => (
                <span key={t} className="tag-purple tag">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Ventures worked on', value: teams.length, icon: Briefcase, color: 'var(--dvl-purple)' },
            { label: 'AI tool entries', value: totalAILogs, icon: Bot, color: 'var(--dvl-teal)' },
            { label: 'Deliverables approved', value: approvedDeliverables, icon: CheckCircle2, color: 'green' },
            { label: 'Mentor sessions', value: totalSessions, icon: Users, color: 'var(--dvl-amber)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                   style={{ background: `${s.color}18` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color, width: 16, height: 16 }} />
              </div>
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Ventures */}
        {teams.map((team) => {
          const approvedMs = team.milestones.filter(m => m.status === 'APPROVED').length
          const member = student?.teamMembers.find(m => m.team.id === team.id)

          return (
            <div key={team.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold">{team.ventureName ?? team.name}</h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {team.course} · {team.sector ?? 'General'} · {phaseLabel(team.currentPhase)}
                  </p>
                </div>
                {member?.role && <span className="tag-purple tag">{member.role}</span>}
              </div>

              {team.problemStatement && (
                <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Problem solved</p>
                  <p className="text-sm">{team.problemStatement}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-lg font-semibold">{approvedMs}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Milestones completed</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{team.aiLogs.length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>AI log entries</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{team.mentorSessions.length}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Mentor sessions</p>
                </div>
              </div>

              {team.demoDay && (
                <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                  <Trophy className="w-4 h-4" style={{ color: 'var(--dvl-amber)' }} />
                  <span className="text-sm font-medium">Demo Day participant</span>
                  {team.demoDay.mvpUrl && (
                    <a href={team.demoDay.mvpUrl} target="_blank" rel="noopener noreferrer"
                       className="ml-auto text-xs text-brand flex items-center gap-1 hover:underline">
                      View MVP <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {teams.length === 0 && (
          <div className="card text-center py-16">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium mb-1">Portfolio is building</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your portfolio will populate as you progress through your DVL journey.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
