import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/utils'
import { Bot, Plus, Zap } from 'lucide-react'
import Link from 'next/link'
import { AILogForm } from '@/components/student/AILogForm'

export const metadata = { title: 'AI Build Log' }

const AI_TOOLS = [
  'ChatGPT', 'Claude', 'Gemini', 'Cursor', 'Replit',
  'Lovable', 'Bolt', 'Colab', 'GitHub Copilot', 'Perplexity',
  'Midjourney', 'Runway', 'Other',
]

async function getTeamAndLogs(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              aiLogs: { orderBy: { loggedAt: 'desc' } },
            },
          },
        },
        take: 1,
      },
    },
  })
  return student?.teamMembers?.[0]?.team ?? null
}

export default async function AILogPage() {
  const session = await getSession()
  if (!session?.id) return null

  const team = await getTeamAndLogs(session.id)

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
                  <div key={log.id} className="p-4 rounded-xl border"
                       style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="tag-teal tag">{log.toolUsed}</span>
                        <span className="text-sm font-medium">{log.activity}</span>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(log.loggedAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {log.purpose && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Purpose</p>
                          <p>{log.purpose}</p>
                        </div>
                      )}
                      {log.promptSummary && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Prompt summary</p>
                          <p>{log.promptSummary}</p>
                        </div>
                      )}
                      {log.outputGenerated && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Output generated</p>
                          <p>{log.outputGenerated}</p>
                        </div>
                      )}
                      {log.humanValidation && (
                        <div>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Human validation</p>
                          <p>{log.humanValidation}</p>
                        </div>
                      )}
                    </div>
                  </div>
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
