import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { Trophy, ExternalLink, Users, Rocket } from 'lucide-react'

export const metadata = { title: 'Demo Day' }

async function getDemoDayData() {
  return prisma.team.findMany({
    where: { currentPhase: { in: ['MVP', 'COMPLETED'] } },
    include: {
      demoDay: true,
      members: { include: { student: { include: { user: true } } } },
      evaluations: true,
      mentor: { include: { user: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export default async function DemoDayPage() {
  const session = await auth()
  if (!session?.user) return null
  const teams = await getDemoDayData()

  return (
    <div className="page-enter">
      <PageHeader
        title="Demo Day"
        subtitle={`${teams.length} ventures in MVP / Completed stage`}
      />
      <div className="page-body space-y-5">
        {teams.length === 0 ? (
          <div className="card text-center py-20">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium mb-2">No teams in MVP stage yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Teams will appear here once they reach the MVP phase.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {teams.map((team) => {
              const avgScore = team.evaluations.length
                ? (team.evaluations.reduce((a, e) => a + (e.totalScore ?? 0), 0) / team.evaluations.length).toFixed(1)
                : null

              return (
                <div key={team.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                           style={{ background: 'var(--dvl-purple-dim)' }}>
                        <Rocket className="w-5 h-5" style={{ color: 'var(--dvl-purple)' }} />
                      </div>
                      <div>
                        <h3 className="text-base">{team.ventureName ?? team.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {team.course} {team.sector ? `· ${team.sector}` : ''}
                        </p>
                      </div>
                    </div>
                    {avgScore && (
                      <div className="text-center">
                        <p className="text-xl font-bold" style={{ color: 'var(--dvl-purple)' }}>{avgScore}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 10</p>
                      </div>
                    )}
                  </div>

                  {/* Members */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Users className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {team.members.map(m => m.student.user.name).join(', ')}
                    </span>
                  </div>

                  {/* Demo Day resources */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    {team.demoDay?.mvpUrl && (
                      <a href={team.demoDay.mvpUrl} target="_blank" rel="noopener noreferrer"
                         className="tag-purple tag flex items-center gap-1 text-xs">
                        <ExternalLink className="w-3 h-3" /> MVP
                      </a>
                    )}
                    {team.demoDay?.demoVideoUrl && (
                      <a href={team.demoDay.demoVideoUrl} target="_blank" rel="noopener noreferrer"
                         className="tag-teal tag flex items-center gap-1 text-xs">
                        <ExternalLink className="w-3 h-3" /> Demo video
                      </a>
                    )}
                    {team.demoDay?.pitchDeckUrl && (
                      <a href={team.demoDay.pitchDeckUrl} target="_blank" rel="noopener noreferrer"
                         className="tag-amber tag flex items-center gap-1 text-xs">
                        <ExternalLink className="w-3 h-3" /> Pitch deck
                      </a>
                    )}
                    {!team.demoDay && (
                      <span className="tag-gray tag text-xs">No showcase profile yet</span>
                    )}
                  </div>

                  {team.mentor && (
                    <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      Mentor: {team.mentor.user.name}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
