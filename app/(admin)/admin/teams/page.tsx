import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, healthColor, healthLabel, formatDate } from '@/lib/utils'
import { Briefcase, Plus } from 'lucide-react'
import Link from 'next/link'
import { CreateTeamButton } from '@/components/admin/CreateTeamButton'
import { DeleteTeamButton } from '@/components/admin/DeleteTeamButton'

export const metadata = { title: 'Teams' }

async function getAllTeams() {
  const [teams, facultyList, mentorList, studentList] = await Promise.all([
    prisma.team.findMany({
      include: {
        members: { include: { student: { include: { user: true } } } },
        facultyGuide: { include: { user: true } },
        mentor: { include: { user: true } },
        milestones: true,
        deliverables: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.facultyProfile.findMany({ include: { user: true } }),
    prisma.mentorProfile.findMany({ include: { user: true } }),
    prisma.studentProfile.findMany({ include: { user: true } }),
  ])
  return { teams, facultyList, mentorList, studentList }
}

export default async function AdminTeamsPage() {
  const session = await getSession()
  if (!session) return null
  const { teams, facultyList, mentorList, studentList } = await getAllTeams()

  return (
    <div className="page-enter">
      <PageHeader
        title="Teams"
        subtitle={`${teams.length} teams in the programme`}
        actions={<CreateTeamButton faculty={facultyList} mentors={mentorList} students={studentList} />}
      />
      <div className="page-body">
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venture</th>
                <th>Course</th>
                <th>Phase</th>
                <th>Health</th>
                <th>Faculty</th>
                <th>Mentor</th>
                <th>Members</th>
                <th>Progress</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <Link href={`/admin/teams/${team.id}`} className="hover:underline">
                      <p className="font-medium">{team.ventureName ?? team.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.name}</p>
                    </Link>
                  </td>
                  <td><span className="tag-gray tag">{team.course}</span></td>
                  <td>
                    <span className={`phase-badge ${phaseColor(team.currentPhase)} text-xs`}>
                      {phaseLabel(team.currentPhase)}
                    </span>
                  </td>
                  <td>
                    <span className={`text-sm font-medium ${healthColor(team.health)}`}>
                      {healthLabel(team.health)}
                    </span>
                  </td>
                  <td className="text-sm">{team.facultyGuide?.user.name ?? '—'}</td>
                  <td className="text-sm">{team.mentor?.user.name ?? '—'}</td>
                  <td className="text-sm font-medium">{team.members.length}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-bar w-16">
                        <div className="progress-fill" style={{ width: `${team.progressPct}%` }} />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.progressPct}%</span>
                    </div>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(team.createdAt)}
                  </td>
                  <td>
                    <DeleteTeamButton teamId={team.id} teamName={team.ventureName ?? team.name} />
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    No teams yet. Create the first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
