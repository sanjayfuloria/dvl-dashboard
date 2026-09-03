import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, phaseLabel, phaseColor, statusColor } from '@/lib/utils'
import { CheckSquare, CheckCircle2, Circle, Clock, FileText } from 'lucide-react'
import { FileUpload } from '@/components/shared/FileUpload'
import { courseSlots, pickActiveMembership } from '@/lib/team-select'
import { CourseTabs } from '@/components/student/CourseTabs'

export const metadata = { title: 'Milestones' }

const PHASES = ['IDEATION', 'PROTOTYPE', 'MVP'] as const

const PHASE_DELIVERABLES: Record<string, string[]> = {
  IDEATION: ['Problem Brief', 'Business Model Canvas', 'Customer Discovery Report', 'Opportunity Assessment'],
  PROTOTYPE: ['Functional Prototype', 'Product Specification', 'User Feedback Summary'],
  MVP: ['MVP Demonstration', 'Pitch Deck', 'Final Report', 'Growth Roadmap'],
}

async function getTeamMemberships(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
              deliverables: { orderBy: { createdAt: 'desc' } },
              workspaceFiles: { orderBy: { uploadedAt: 'desc' } },
            },
          },
        },
        // A student can hold a separate team membership per DVL course —
        // fetch all of them, not just the first.
      },
    },
  })
  return student?.teamMembers ?? []
}

export default async function MilestonesPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>
}) {
  const session = await getSession()
  if (!session?.id) return null
  const { course: requestedCourse } = await searchParams
  const memberships = await getTeamMemberships(session.id)
  const courses = courseSlots(memberships)
  const team = pickActiveMembership(memberships, requestedCourse)?.team ?? null
  const activeCourse = team?.course ?? requestedCourse ?? courses[0] ?? ''

  return (
    <div className="page-enter">
      <PageHeader
        title="Milestones & Deliverables"
        subtitle="Track your DVL journey and upload your deliverables"
      />
      <div className="page-body space-y-8">
        <CourseTabs courses={courses} active={activeCourse} basePath="/milestones" />
        {!team ? (
          <div className="card text-center py-20">
            <CheckSquare className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">No team assigned yet</p>
          </div>
        ) : (
          PHASES.map((phase) => {
            const milestones = team.milestones.filter(m => m.phase === phase)
            const deliverables = team.deliverables.filter(d => {
              const m = team.milestones.find(m => m.id === d.milestoneId)
              return m?.phase === phase || (!d.milestoneId && d.type)
            })
            const phaseComplete = milestones.length > 0 && milestones.every(m => m.status === 'APPROVED')
            const phaseActive = team.currentPhase === phase

            return (
              <div key={phase}>
                {/* Phase header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    phaseComplete ? 'bg-green-100' : phaseActive ? '' : 'bg-gray-100'
                  }`} style={phaseActive && !phaseComplete ? { background: 'var(--dvl-purple-dim)' } : {}}>
                    {phaseComplete
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : phaseActive
                      ? <Clock className="w-4 h-4" style={{ color: 'var(--dvl-purple)' }} />
                      : <Circle className="w-4 h-4 text-gray-300" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <h2>{phaseLabel(phase)}</h2>
                    <span className={`phase-badge ${phaseColor(phase)} text-xs`}>{phase}</span>
                    {phaseActive && <span className="tag-purple tag text-xs">Current phase</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 ml-11">
                  {/* Milestones */}
                  <div className="card">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" /> Milestones
                    </h3>
                    {milestones.length > 0 ? (
                      <div className="space-y-2">
                        {milestones.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0"
                               style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-start gap-2">
                              {m.status === 'APPROVED'
                                ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                : m.status === 'IN_PROGRESS'
                                ? <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--dvl-purple)' }} />
                                : <Circle className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />}
                              <div>
                                <p className="text-sm font-medium">{m.title}</p>
                                {m.dueDate && (
                                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    Due {formatDate(m.dueDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`tag text-[10px] ${statusColor(m.status)}`}>
                              {m.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No milestones set yet</p>
                    )}
                  </div>

                  {/* Deliverables with upload */}
                  <div className="card">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Deliverables
                    </h3>
                    <div className="space-y-3">
                      {PHASE_DELIVERABLES[phase].map((name) => {
                        const submitted = deliverables.find(d => d.type === name || d.title === name)
                        return (
                          <div key={name}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {submitted?.status === 'APPROVED'
                                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                  : submitted
                                  ? <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--dvl-amber)' }} />
                                  : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                                <span className="text-sm">{name}</span>
                              </div>
                              {submitted && (
                                <span className={`tag text-[10px] ${statusColor(submitted.status)}`}>
                                  {submitted.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>

                            {/* Show existing file link */}
                            {submitted?.fileUrl && (
                              <a href={submitted.fileUrl} target="_blank" rel="noopener noreferrer"
                                 className="text-xs flex items-center gap-1 mb-1"
                                 style={{ color: 'var(--dvl-teal)' }}>
                                📄 View in Google Drive
                              </a>
                            )}
                            {submitted?.feedback && (
                              <div className="mt-1 p-2 rounded-lg text-xs"
                                   style={{ background: 'var(--dvl-purple-dim)', color: 'var(--dvl-purple)' }}>
                                <span className="font-semibold">Faculty feedback: </span>{submitted.feedback}
                              </div>
                            )}

                            {/* Upload button for active phase */}
                            {phaseActive && submitted?.status !== 'APPROVED' && (
                              <FileUpload
                                teamId={team.id}
                                fileType={name}
                                milestoneId={submitted?.id}
                                label={submitted ? 'Re-upload' : 'Upload'}
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.zip"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}

        {/* Workspace files */}
        {team && team.workspaceFiles.length > 0 && (
          <div className="card">
            <h3 className="mb-4">All uploaded files</h3>
            <table className="data-table">
              <thead>
                <tr><th>File</th><th>Type</th><th>Uploaded</th><th>Link</th></tr>
              </thead>
              <tbody>
                {team.workspaceFiles.map((f: any) => (
                  <tr key={f.id}>
                    <td className="font-medium text-sm">{f.name}</td>
                    <td><span className="tag-gray tag text-xs">{f.type}</span></td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(f.uploadedAt)}</td>
                    <td>
                      {f.fileUrl ? (
                        <a href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-brand flex items-center gap-1 hover:underline">
                          View in Drive
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
    </div>
  )
}
