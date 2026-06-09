import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, healthLabel, healthColor, statusColor, formatDate } from '@/lib/utils'
import {
  Users, CheckSquare, FileText, Bot, TrendingUp, Star,
  ExternalLink, FolderOpen, MessageSquare, Calendar, ChevronLeft
} from 'lucide-react'
import Link from 'next/link'
import { EvaluationPanel } from '@/components/faculty/EvaluationPanel'

export async function generateMetadata({ params }: { params: { teamId: string } }) {
  const team = await prisma.team.findUnique({ where: { id: params.teamId } })
  return { title: team?.ventureName ?? team?.name ?? 'Team' }
}

async function getTeamDetail(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { student: { include: { user: true } } } },
      milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
      deliverables: { orderBy: { createdAt: 'desc' } },
      evaluations: { orderBy: { createdAt: 'desc' } },
      aiLogs: { orderBy: { loggedAt: 'desc' } },
      reflections: {
        orderBy: { submittedAt: 'desc' },
        include: { comments: { include: { faculty: { include: { user: true } } } } },
      },
      mentorSessions: { orderBy: { meetingDate: 'desc' } },
      facultyGuide: { include: { user: true } },
      mentor: { include: { user: true } },
    },
  })
}

export default async function TeamDetailPage({ params }: { params: { teamId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const team = await getTeamDetail(params.teamId)
  if (!team) notFound()

  const facultyProfile = await prisma.facultyProfile.findUnique({ where: { userId: session.user.id } })

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
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <span className={`phase-badge ${phaseColor(team.currentPhase)}`}>{phaseLabel(team.currentPhase)}</span>
              <span className={`text-sm font-medium ${healthColor(team.health)}`}>{healthLabel(team.health)}</span>
              {team.driveFolderId && (
                <a href={`https://drive.google.com/drive/folders/${team.driveFolderId}`}
                   target="_blank" rel="noopener noreferrer"
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
              <p className="text-sm mt-3 p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                {team.problemStatement}
              </p>
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

        {/* Members */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Team members</h3>
          <div className="flex flex-wrap gap-3">
            {team.members.map(m => (
              <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                   style={{ background: 'var(--surface-raised)' }}>
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

        {/* Deliverables for review */}
        {team.deliverables.filter(d => d.status === 'SUBMITTED').length > 0 && (
          <div className="card border-2" style={{ borderColor: 'var(--dvl-amber)', background: '#fffbeb' }}>
            <h3 className="mb-4 flex items-center gap-2 text-amber-800">
              <FileText className="w-4 h-4" />
              Pending review ({team.deliverables.filter(d => d.status === 'SUBMITTED').length})
            </h3>
            <div className="space-y-2">
              {team.deliverables.filter(d => d.status === 'SUBMITTED').map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-white rounded-lg border"
                     style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium">{d.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Submitted {formatDate(d.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button className="tag-green tag cursor-pointer hover:opacity-80 text-xs">Approve</button>
                    <button className="tag-red tag cursor-pointer hover:opacity-80 text-xs">Request revision</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones timeline */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Milestones</h3>
          <table className="data-table">
            <thead><tr><th>Milestone</th><th>Phase</th><th>Due date</th><th>Status</th></tr></thead>
            <tbody>
              {team.milestones.map(m => (
                <tr key={m.id}>
                  <td className="font-medium">{m.title}</td>
                  <td><span className={`phase-badge ${phaseColor(m.phase)} text-xs`}>{m.phase}</span></td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(m.dueDate)}</td>
                  <td><span className={`tag text-xs ${statusColor(m.status)}`}>{m.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI tool usage */}
        {team.aiLogs.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2"><Bot className="w-4 h-4" /> AI tools used</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(toolCounts).sort(([,a],[,b]) => b-a).map(([tool, count]) => (
                <span key={tool} className="tag-teal tag">{tool} <span className="opacity-60 ml-1">{count}×</span></span>
              ))}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {team.aiLogs.slice(0, 10).map(l => (
                <div key={l.id} className="flex items-start gap-3 text-sm p-2 rounded-lg"
                     style={{ background: 'var(--surface-raised)' }}>
                  <span className="tag-teal tag text-xs shrink-0">{l.toolUsed}</span>
                  <span className="flex-1">{l.activity}</span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{formatDate(l.loggedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reflections */}
        {team.reflections.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Reflections</h3>
            <div className="space-y-3">
              {team.reflections.map(r => (
                <div key={r.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{r.month}</p>
                    <button className="tag-purple tag text-xs flex items-center gap-1 cursor-pointer hover:opacity-80">
                      <MessageSquare className="w-3 h-3" /> Add comment
                    </button>
                  </div>
                  {r.whatAchieved && <p className="text-sm">{r.whatAchieved}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mentor sessions */}
        {team.mentorSessions.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> Mentor sessions</h3>
            <div className="space-y-3">
              {team.mentorSessions.map(s => (
                <div key={s.id} className="p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm font-medium">{formatDate(s.meetingDate)}</span>
                  </div>
                  {s.summary && <p className="text-sm">{s.summary}</p>}
                  {s.actionItems && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Action items: {s.actionItems}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evaluation panel */}
        {facultyProfile && (
          <EvaluationPanel
            team={{ id: team.id, currentPhase: team.currentPhase, evaluations: team.evaluations }}
            facultyId={facultyProfile.id}
          />
        )}
      </div>
    </div>
  )
}
