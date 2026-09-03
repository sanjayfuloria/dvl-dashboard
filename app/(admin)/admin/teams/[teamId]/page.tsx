import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, healthLabel, healthColor, statusColor, formatDate } from '@/lib/utils'
import { Users, CheckSquare, Bot, Calendar, ChevronLeft, FolderOpen, FileText, ExternalLink, MessageSquare, Award } from 'lucide-react'
import { PhaseAdvanceControl } from '@/components/admin/PhaseAdvanceControl'
import Link from 'next/link'

async function getTeamDetail(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { student: { include: { user: true } } } },
      milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
      deliverables: { orderBy: { createdAt: 'desc' } },
      evaluations: { orderBy: { createdAt: 'desc' }, include: { faculty: { include: { user: true } }, mentor: { include: { user: true } } } },
      aiLogs: { orderBy: { loggedAt: 'desc' } },
      reflections: { orderBy: { submittedAt: 'desc' }, include: { comments: { include: { faculty: { include: { user: true } } } } } },
      mentorSessions: { orderBy: { meetingDate: 'desc' } },
      facultyGuide: { include: { user: true } },
      mentor: { include: { user: true } },
    },
  })
}

export default async function AdminTeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const session = await getSession()
  if (!session) return null
  const { teamId } = await params
  const team = await getTeamDetail(teamId)
  if (!team) notFound()

  const toolCounts: Record<string, number> = {}
  team.aiLogs.forEach(l => { toolCounts[l.toolUsed] = (toolCounts[l.toolUsed] ?? 0) + 1 })

  return (
    <div className="page-enter">
      <PageHeader
        title={team.ventureName ?? team.name}
        subtitle={`${team.name} · ${team.course}`}
        actions={<Link href="/admin/teams" className="btn-secondary"><ChevronLeft className="w-4 h-4" /> All teams</Link>}
      />
      <div className="page-body space-y-6">

        {/* Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card col-span-3 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`phase-badge ${phaseColor(team.currentPhase)}`}>{phaseLabel(team.currentPhase)}</span>
              <span className={`text-sm font-medium ${healthColor(team.health)}`}>{healthLabel(team.health)}</span>
              <span className="tag tag-gray">{team.course}</span>
              {team.sector && <span className="tag tag-gray">{team.sector}</span>}
              <PhaseAdvanceControl teamId={team.id} currentPhase={team.currentPhase} />
              {team.driveFolderId && (
                <a href={`https://drive.google.com/drive/folders/${team.driveFolderId}`} target="_blank" rel="noopener noreferrer"
                   className="ml-auto text-xs text-brand flex items-center gap-1 hover:underline">
                  <FolderOpen className="w-3.5 h-3.5" /> Drive folder
                </a>
              )}
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>Overall progress</span>
                <span className="font-semibold">{team.progressPct}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${team.progressPct}%` }} /></div>
            </div>
            {team.problemStatement && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Problem statement</p>
                <p className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>{team.problemStatement}</p>
              </div>
            )}
            {team.targetUsers && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Target users</p>
                <p className="text-sm p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>{team.targetUsers}</p>
              </div>
            )}
          </div>
          <div className="card space-y-3">
            {[
              { label: 'Members',                value: team.members.length },
              { label: 'Milestones approved',    value: team.milestones.filter(m => m.status === 'APPROVED').length },
              { label: 'Deliverables submitted', value: team.deliverables.filter(d => d.status === 'SUBMITTED').length },
              { label: 'Deliverables approved',  value: team.deliverables.filter(d => d.status === 'APPROVED').length },
              { label: 'AI log entries',         value: team.aiLogs.length },
              { label: 'Reflections',            value: team.reflections.length },
              { label: 'Mentor sessions',        value: team.mentorSessions.length },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span className="font-semibold text-sm">{s.value}</span>
              </div>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Faculty guide</p>
              <p className="text-sm font-medium">{team.facultyGuide?.user.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Industry mentor</p>
              <p className="text-sm font-medium">{team.mentor?.user.name ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Users className="w-4 h-4" /> Team members</h3>
          {team.members.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No members assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Enrol No</th><th>Section</th><th>Role</th><th>Joined</th></tr></thead>
                <tbody>
                  {team.members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                               style={{ background: 'var(--dvl-indigo)' }}>
                            {m.student.user.name?.charAt(0) ?? '?'}
                          </div>
                          <span className="font-medium text-sm">{m.student.user.name}</span>
                        </div>
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.student.user.email}</td>
                      <td className="text-xs font-mono">{(m.student as any).enrollNo ?? '—'}</td>
                      <td>{(m.student as any).section ? <span className="tag tag-gray text-xs">{(m.student as any).section}</span> : '—'}</td>
                      <td className="text-xs">{m.role ?? '—'}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(m.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <CheckSquare className="w-4 h-4" /> Milestones <span className="tag tag-gray font-normal">{team.milestones.length}</span>
          </h3>
          {team.milestones.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No milestones defined yet.</p>
          ) : (
            <div className="space-y-2">
              {team.milestones.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                  <div className="flex items-center gap-3">
                    <span className={`phase-badge ${phaseColor(m.phase)} text-xs`}>{phaseLabel(m.phase)}</span>
                    <span className="text-sm font-medium">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {m.dueDate && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Due {formatDate(m.dueDate)}</span>}
                    <span className={`tag text-xs ${statusColor(m.status)}`}>{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliverables */}
        <div className="card">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <FileText className="w-4 h-4" /> Deliverables <span className="tag tag-gray font-normal">{team.deliverables.length}</span>
          </h3>
          {team.deliverables.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No deliverables submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Submitted</th><th>File</th></tr></thead>
                <tbody>
                  {team.deliverables.map(d => (
                    <tr key={d.id}>
                      <td className="font-medium text-sm">{d.title}</td>
                      <td><span className="tag tag-gray text-xs">{d.type}</span></td>
                      <td><span className={`tag text-xs ${statusColor(d.status)}`}>{d.status}</span></td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.submittedAt ? formatDate(d.submittedAt) : '—'}</td>
                      <td>
                        {d.fileUrl ? (
                          <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand text-xs flex items-center gap-1 hover:underline">
                            <ExternalLink className="w-3 h-3" /> View
                          </a>
                        ) : d.driveFileId ? (
                          <a href={`https://drive.google.com/file/d/${d.driveFileId}/view`} target="_blank" rel="noopener noreferrer"
                             className="text-brand text-xs flex items-center gap-1 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Drive
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Evaluations */}
        {team.evaluations.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Award className="w-4 h-4" /> Evaluations <span className="tag tag-gray font-normal">{team.evaluations.length}</span>
            </h3>
            <div className="space-y-3">
              {team.evaluations.map(e => (
                <div key={e.id} className="p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`phase-badge ${phaseColor(e.phase)} text-xs`}>{phaseLabel(e.phase)}</span>
                      <span className="tag tag-gray text-xs">{e.evaluatorType}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        by {e.faculty?.user.name ?? e.mentor?.user.name ?? 'Jury'}
                      </span>
                    </div>
                    {e.totalScore != null && (
                      <span className="font-semibold text-sm" style={{ color: 'var(--dvl-purple)' }}>{e.totalScore.toFixed(1)} / 10</span>
                    )}
                  </div>
                  {e.feedback && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{e.feedback}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Build Log */}
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

        {/* Reflections */}
        {team.reflections.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="w-4 h-4" /> Reflections <span className="tag tag-gray font-normal">{team.reflections.length}</span>
            </h3>
            <div className="space-y-3">
              {team.reflections.map(r => (
                <div key={r.id} className="p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{r.month}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(r.submittedAt)}</span>
                  </div>
                  {r.whatAchieved && <p className="text-xs mb-1"><span className="font-medium">Achieved: </span>{r.whatAchieved}</p>}
                  {r.nextSteps && <p className="text-xs"><span className="font-medium">Next steps: </span>{r.nextSteps}</p>}
                  {r.comments.length > 0 && (
                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
                      {r.comments.map(c => (
                        <p key={c.id} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-medium">{c.faculty?.user.name ?? 'Faculty'}: </span>{c.comment}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mentor Sessions */}
        {team.mentorSessions.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="w-4 h-4" /> Mentor sessions <span className="tag tag-gray font-normal">{team.mentorSessions.length}</span>
            </h3>
            <div className="space-y-2">
              {team.mentorSessions.map(s => (
                <div key={s.id} className="p-3 rounded-lg" style={{ background: 'var(--surface-raised)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{formatDate(s.meetingDate)}</span>
                  </div>
                  {s.summary && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.summary}</p>}
                  {s.actionItems && <p className="text-xs mt-1"><span className="font-medium">Action items: </span>{s.actionItems}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
