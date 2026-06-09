import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, phaseLabel, phaseColor, statusColor } from '@/lib/utils'
import { CheckSquare, Upload, Clock, CheckCircle2, Circle, FileText, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Milestones' }

const PHASES = ['IDEATION', 'PROTOTYPE', 'MVP'] as const
const PHASE_DELIVERABLES: Record<string, string[]> = {
  IDEATION: ['Problem Brief', 'Business Model Canvas', 'Customer Discovery Report', 'Opportunity Assessment'],
  PROTOTYPE: ['Functional Prototype', 'Product Specification', 'User Feedback Summary'],
  MVP: ['MVP Demonstration', 'Pitch Deck', 'Final Report', 'Growth Roadmap'],
}

async function getTeamMilestones(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              milestones: { orderBy: [{ phase: 'asc' }, { createdAt: 'asc' }] },
              deliverables: { orderBy: { createdAt: 'desc' } },
            },
          },
        },
        take: 1,
      },
    },
  })
  return student?.teamMembers?.[0]?.team ?? null
}

export default async function MilestonesPage() {
  const session = await getSession()
  if (!session?.id) return null
  const team = await getTeamMilestones(session.id)

  const milestonesByPhase = PHASES.reduce((acc, phase) => {
    acc[phase] = team?.milestones.filter((m) => m.phase === phase) ?? []
    return acc
  }, {} as Record<string, typeof team extends null ? [] : NonNullable<typeof team>['milestones']>)

  const deliverablesByPhase = PHASES.reduce((acc, phase) => {
    acc[phase] = team?.deliverables.filter((d) => {
      const m = team?.milestones.find((m) => m.id === d.milestoneId)
      return m?.phase === phase || (!d.milestoneId && d.type)
    }) ?? []
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="page-enter">
      <PageHeader title="Milestones & Deliverables" subtitle="Track your DVL journey phase by phase" />
      <div className="page-body space-y-8">
        {!team ? (
          <div className="card text-center py-20">
            <CheckSquare className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">No team assigned yet</p>
          </div>
        ) : (
          PHASES.map((phase) => {
            const milestones = milestonesByPhase[phase] as any[] ?? []
            const deliverables = team.deliverables.filter((d) => {
              const m = team.milestones.find((m) => m.id === d.milestoneId)
              return m?.phase === phase
            })
            const phaseComplete = milestones.every((m: any) => m.status === 'APPROVED')
            const phaseActive = team.currentPhase === phase

            return (
              <div key={phase}>
                {/* Phase header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${phaseComplete ? 'bg-green-100' : phaseActive ? '' : 'bg-gray-100'}`}
                       style={phaseActive && !phaseComplete ? { background: 'var(--dvl-purple-dim)' } : {}}>
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

                  {/* Deliverables */}
                  <div className="card">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Deliverables
                    </h3>
                    <div className="space-y-2">
                      {PHASE_DELIVERABLES[phase].map((name) => {
                        const submitted = deliverables.find((d) => d.type === name || d.title === name)
                        return (
                          <div key={name} className="flex items-center justify-between py-2 border-b last:border-0"
                               style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                              {submitted?.status === 'APPROVED'
                                ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                : submitted
                                ? <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--dvl-amber)' }} />
                                : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                              <span className="text-sm">{name}</span>
                            </div>
                            {submitted ? (
                              <span className={`tag text-[10px] ${statusColor(submitted.status)}`}>
                                {submitted.status.replace('_', ' ')}
                              </span>
                            ) : phaseActive ? (
                              <button className="tag-purple tag text-[10px] flex items-center gap-1 cursor-pointer hover:opacity-80">
                                <Upload className="w-3 h-3" /> Submit
                              </button>
                            ) : (
                              <span className="tag-gray tag text-[10px]">Pending</span>
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
      </div>
    </div>
  )
}
