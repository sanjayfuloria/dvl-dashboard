import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { Bot, Plus, Zap } from 'lucide-react'
import Link from 'next/link'
import { AILogForm } from '@/components/student/AILogForm'
import { AILogEntry } from '@/components/student/AILogEntry'
import { courseSlots, pickActiveMembership } from '@/lib/team-select'
import { CourseTabs } from '@/components/student/CourseTabs'

export const metadata = { title: 'AI Build Log' }

const AI_TOOLS = [
  'ChatGPT', 'Claude', 'Gemini', 'Cursor', 'Replit',
  'Lovable', 'Bolt', 'Colab', 'GitHub Copilot', 'Perplexity',
  'Midjourney', 'Runway', 'Other',
]

async function getTeamMemberships(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              aiLogs: {
                where: { archivedAt: null },
                orderBy: { loggedAt: 'desc' },
                include: { versions: { orderBy: { editedAt: 'desc' } } },
              },
            },
          },
        },
        // A student can hold a separate team membership per DVL course.
      },
    },
  })
  return student?.teamMembers ?? []
}

export default async function AILogPage({
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

  // Tool usage summary
  const toolCounts: Record<string, number> = {}
  team?.aiLogs.forEach((log) => {
    toolCounts[log.toolUsed] = (toolCounts[log.toolUsed] ?? 0) + 1
  })
  const topTools = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="page-enter">
      <PageHeader
        title="AI Build Log"
        subtitle="Document every AI tool usage for your venture"
        actions={
          team ? (
            <AILogForm teamId={team.id} tools={AI_TOOLS} />
          ) : null
        }
      />
      <div className="page-body space-y-6">
        <CourseTabs courses={courses} active={activeCourse} basePath="/ai-log" />
        {/* Summary stats */}
        {team && team.aiLogs.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-2xl font-semibold">{team.aiLogs.length}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total entries</p>
            </div>
            <div className="stat-card">
              <p className="text-2xl font-semibold">{Object.keys(toolCounts).length}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tools used</p>
            </div>
            {topTools.slice(0, 2).map(([tool, count]) => (
              <div key={tool} className="stat-card">
                <p className="text-2xl font-semibold">{count}×</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{tool}</p>
              </div>
            ))}
          </div>
        )}

        {/* Top tools */}
        {topTools.length > 0 && (
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: 'var(--dvl-amber)' }} />
              Tools used
            </h3>
            <div className="flex flex-wrap gap-2">
              {topTools.map(([tool, count]) => (
                <span key={tool} className="tag-purple tag">
                  {tool} <span className="opacity-60 ml-1">{count}×</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Log entries */}
        <div className="card">
          <h3 className="mb-4">Log entries</h3>
          {team ? (
            team.aiLogs.length > 0 ? (
              <div className="space-y-4">
                {team.aiLogs.map((log) => (
                  <AILogEntry key={log.id} log={log} tools={AI_TOOLS} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Bot className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-base font-medium">No AI log entries yet</p>
                <p className="text-sm mt-1">Document every AI tool you use in your venture</p>
              </div>
            )
          ) : (
            <div className="empty-state">
              <p className="text-sm">You need to be in a team to log AI usage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
