import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts'

export const metadata = { title: 'Analytics' }

async function getAnalyticsData() {
  const [teams, evaluations, aiLogs, milestones] = await Promise.all([
    prisma.team.findMany({ include: { milestones: true, deliverables: true } }),
    prisma.evaluation.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.aIBuildLog.findMany(),
    prisma.milestone.findMany(),
  ])

  // Phase distribution
  const phaseData = ['IDEATION', 'PROTOTYPE', 'MVP', 'COMPLETED'].map(phase => ({
    phase: phase.charAt(0) + phase.slice(1).toLowerCase(),
    count: teams.filter(t => t.currentPhase === phase).length,
  }))

  // Course split
  const courseData = [
    { course: 'MPB', count: teams.filter(t => t.course === 'MPB').length },
    { course: 'MDT', count: teams.filter(t => t.course === 'MDT').length },
  ]

  // AI tool usage
  const toolCounts: Record<string, number> = {}
  aiLogs.forEach(l => { toolCounts[l.toolUsed] = (toolCounts[l.toolUsed] ?? 0) + 1 })
  const aiToolData = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tool, count]) => ({ tool, count }))

  // Health distribution
  const healthData = [
    { health: 'On Track', count: teams.filter(t => t.health === 'ON_TRACK').length },
    { health: 'At Risk', count: teams.filter(t => t.health === 'AT_RISK').length },
    { health: 'Delayed', count: teams.filter(t => t.health === 'DELAYED').length },
  ]

  // Evaluation scores by phase
  const evalScoreData = ['IDEATION', 'PROTOTYPE', 'MVP'].map(phase => {
    const phaseEvals = evaluations.filter(e => e.phase === phase && e.totalScore)
    const avg = phaseEvals.length
      ? phaseEvals.reduce((a, e) => a + (e.totalScore ?? 0), 0) / phaseEvals.length
      : 0
    return {
      phase: phase.charAt(0) + phase.slice(1).toLowerCase(),
      avgScore: Math.round(avg * 10) / 10,
      count: phaseEvals.length,
    }
  })

  return { phaseData, courseData, aiToolData, healthData, evalScoreData }
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user) return null
  const data = await getAnalyticsData()

  return (
    <div className="page-enter">
      <PageHeader title="Analytics" subtitle="Programme-level insights and metrics" />
      <div className="page-body">
        <AnalyticsCharts {...data} />
      </div>
    </div>
  )
}
