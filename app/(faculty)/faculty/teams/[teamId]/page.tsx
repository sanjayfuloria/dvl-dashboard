import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, healthLabel, healthColor, statusColor, formatDate } from '@/lib/utils'
import { Users, CheckSquare, Bot, TrendingUp, Calendar, ChevronLeft, FolderOpen, FileText, ExternalLink, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { EvaluationPanel } from '@/components/faculty/EvaluationPanel'
import { DeliverableReview } from '@/components/faculty/DeliverableReview'

async function getTeamDetail(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { student: { include: { user: true } } } },
      milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
      deliverables: { orderBy: { createdAt: 'desc' }, include: { milestone: { select: { id: true, title: true, phase: true } } } },
      evaluations: { orderBy: { createdAt: 'desc' } },
      aiLogs: { orderBy: { loggedAt: 'desc' } },
      reflections: { orderBy: { submittedAt: 'desc' }, include: { comments: { include: { faculty: { include: { user: true } } } } } },
      mentorSessions: { orderBy: { meetingDate: 'desc' } },
      facultyGuide: { include: { user: true } },
      mentor: { include: { user: true } },
    },
  })
}

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const session = await getSession()
  if (!session?.id) return null

  const { teamId } = await params
  const team = await getTeamDetail(teamId)
  if (!team) notFound()

  const facultyProfile = await prisma.facultyProfile.findUnique({ where: { userId: session.id } })
  const toolCounts: Record<string, number> = {}
  team.aiLogs.forEach(l => { toolCounts[l.toolUsed] = (toolCounts[l.toolUsed] ?? 0) + 1 })

  return (
    <div className="page-enter">
      <PageHeader
        title={team.ventureName ?? team.name}
        subtitle={`${team.name} · ${team.course}`}
        actions={
          <Link href="/faculty/teams" className="btn-secondary">
            <ChevronLeft className="w-4 h-4" /> All teams
          </Link>
        }
      />
      <div className="page-body space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="card col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <span className={`phase-badge ${phaseColor(team.currentPhase)}`}>{phaseLabel(team.currentPhase)}</span>
              <span className={`text-sm font-medium ${healthColor(team.health)}`}>{healthLabel(team.health)}</span>
              {team.driveFolderId && (
                <a href={`https://drive.google.com/drive/folders/${team.driveFolderId}`} target="_blank" rel="noopener noreferrer"
                   className="ml-auto text-xs text-brand flex items-center gap-1 hover:underline">
                  <FolderOpen className="w-3.5 h-3.5" /> Drive folder
                </a>
              )}
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                <span className="font-medium">{team.progressPct}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${team.progressPct}%` }} /></div>
            </div>
            {team.problemStatement && (
              <p className="text-sm mt-3 p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>{team.problemStatement}</p>
            )}
          </div>
          <div className="card space-y-3">
            {[
              { label: 'Milestones approved', value: team.milestones.filter(m => m.status === 'APPROVED').length },
              { label: 'Pending reviews', value: team.deliverables.filter(d => d.status === 'SUBMITTED').length },
              { label: 'AI log entries', value: team.aiLogs.length },
              { label: 'Mentor sessions', value: team.mentorSessions.length },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Team members</h3>
          <div className="flex flex-wrap gap-3">
            {team.members.map(m => (
              <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                     style={{ background: 'var(--dvl-indigo)' }}>
                  {m.student.user.name?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.student.user.name}</p>
                  {m.role && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.role}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {team.aiLogs.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Bot className="w-4 h-4" /> AI Build Log <span className="tag tag-gray font-normal">{team.aiLogs.length} entries</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(toolCounts).map(([tool, count]) => (
                <span key={tool} className="tag tag-gray text-xs">{tool} × {count}</span>
              ))}
            </div>
            <div className="space-y-2">
              {team.aiLogs.slice(0, 5).map(l => (
                <div key={l.id} className="p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{l.activity}</span>
                    <div className="flex items-center gap-2">
                      {l.archivedAt && <span className="tag tag-red text-xs">Archived</span>}
                      <span className="tag tag-gray text-xs">{l.toolUsed}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(l.loggedAt)}</span>
                    </div>
                  </div>
                  {l.purpose && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.purpose}</p>}
                </div>
              ))}
              {team.aiLogs.length > 5 && (
                <p className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>+ {team.aiLogs.length - 5} more entries</p>
              )}
            </div>
          </div>
        )}

        {facultyProfile && (
          <EvaluationPanel
            team={{ id: team.id, currentPhase: team.currentPhase, evaluations: team.evaluations }}
            facultyId={facultyProfile.id}
          />
        )}

        <DeliverableReview
          teamId={team.id}
          deliverables={team.deliverables.map((d: any) => ({
            id: d.id,
            title: d.title,
            type: d.type,
            status: d.status,
            fileUrl: d.fileUrl,
            driveFileId: d.driveFileId,
            submittedAt: d.submittedAt?.toISOString() ?? null,
            feedback: d.feedback,
            milestone: d.milestone ?? null,
          }))}
        />
      </div>
    </div>
  )
}
