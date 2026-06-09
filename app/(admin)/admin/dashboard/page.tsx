import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor, formatDate } from '@/lib/utils'
import {
  Users, Briefcase, Rocket, UserCheck, BarChart3,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Bot
} from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Admin Dashboard' }

async function getAdminStats() {
  const [
    totalUsers, totalStudents, totalFaculty, totalMentors,
    totalTeams, activeTeams, atRiskTeams,
    milestonesTotal, milestonesApproved,
    aiLogCount, totalDeliverables, approvedDeliverables,
    recentTeams, recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'FACULTY' } }),
    prisma.user.count({ where: { role: 'MENTOR' } }),
    prisma.team.count(),
    prisma.team.count({ where: { currentPhase: { not: 'COMPLETED' } } }),
    prisma.team.count({ where: { health: 'AT_RISK' } }),
    prisma.milestone.count(),
    prisma.milestone.count({ where: { status: 'APPROVED' } }),
    prisma.aIBuildLog.count(),
    prisma.deliverable.count(),
    prisma.deliverable.count({ where: { status: 'APPROVED' } }),
    prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        members: true,
        facultyGuide: { include: { user: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const phaseBreakdown = await prisma.team.groupBy({
    by: ['currentPhase'],
    _count: true,
  })

  const courseBreakdown = await prisma.team.groupBy({
    by: ['course'],
    _count: true,
  })

  return {
    totalUsers, totalStudents, totalFaculty, totalMentors,
    totalTeams, activeTeams, atRiskTeams,
    milestonesTotal, milestonesApproved,
    aiLogCount, totalDeliverables, approvedDeliverables,
    recentTeams, recentUsers, phaseBreakdown, courseBreakdown,
  }
}

export default async function AdminDashboard() {
  const session = await getSession()
  if (!session) return null
  const stats = await getAdminStats()

  const topStats = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, color: 'var(--dvl-purple)' },
    { label: 'Active teams', value: stats.activeTeams, icon: Briefcase, color: 'var(--dvl-teal)' },
    { label: 'Industry mentors', value: stats.totalMentors, icon: UserCheck, color: 'var(--dvl-amber)' },
    { label: 'AI log entries', value: stats.aiLogCount, icon: Bot, color: '#8b5cf6' },
  ]

  return (
    <div className="page-enter">
      <PageHeader
        title="Programme Dashboard"
        subtitle="Digital Venture Lab — IFHE Hyderabad"
        actions={
          <Link href="/admin/users" className="btn-primary">
            <Users className="w-4 h-4" /> Manage users
          </Link>
        }
      />

      <div className="page-body space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-4 gap-4">
          {topStats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                     style={{ background: `${s.color}18` }}>
                  <s.icon className="w-4.5 h-4.5" style={{ color: s.color, width: 18, height: 18 }} />
                </div>
              </div>
              <p className="text-3xl font-semibold">{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* User breakdown + phase breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card col-span-1">
            <h3 className="mb-4">User breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Students', count: stats.totalStudents, pct: Math.round(stats.totalStudents / stats.totalUsers * 100), color: 'var(--dvl-purple)' },
                { label: 'Faculty', count: stats.totalFaculty, pct: Math.round(stats.totalFaculty / stats.totalUsers * 100), color: 'var(--dvl-teal)' },
                { label: 'Mentors', count: stats.totalMentors, pct: Math.round(stats.totalMentors / stats.totalUsers * 100), color: 'var(--dvl-amber)' },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{r.label}</span>
                    <span className="font-medium">{r.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card col-span-1">
            <h3 className="mb-4">Teams by phase</h3>
            <div className="space-y-3">
              {stats.phaseBreakdown.map((p) => (
                <div key={p.currentPhase} className="flex items-center justify-between">
                  <span className={`phase-badge ${phaseColor(p.currentPhase)} text-xs`}>
                    {phaseLabel(p.currentPhase)}
                  </span>
                  <span className="text-lg font-semibold">{p._count}</span>
                </div>
              ))}
              {stats.atRiskTeams > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t text-sm"
                     style={{ borderColor: 'var(--border)', color: 'var(--dvl-amber)' }}>
                  <AlertTriangle className="w-4 h-4" />
                  {stats.atRiskTeams} teams at risk
                </div>
              )}
            </div>
          </div>

          <div className="card col-span-1">
            <h3 className="mb-4">Milestone progress</h3>
            <div className="text-center py-3">
              <p className="text-4xl font-semibold">{stats.milestonesApproved}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                of {stats.milestonesTotal} approved
              </p>
            </div>
            <div className="progress-bar mt-2">
              <div className="progress-fill"
                   style={{ width: `${stats.milestonesTotal ? Math.round(stats.milestonesApproved / stats.milestonesTotal * 100) : 0}%` }} />
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between text-sm"
                 style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Deliverables approved</span>
              <span className="font-medium">{stats.approvedDeliverables} / {stats.totalDeliverables}</span>
            </div>
          </div>
        </div>

        {/* Course breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {stats.courseBreakdown.map((c) => (
            <div key={c.course} className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                   style={{ background: c.course === 'MPB' ? 'var(--dvl-purple)' : 'var(--dvl-teal)' }}>
                {c.course}
              </div>
              <div>
                <p className="text-2xl font-semibold">{c._count}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {c.course === 'MPB' ? 'Managing Platform Businesses' : 'Managing Digital Transformation'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent teams */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent teams</h3>
            <Link href="/admin/teams" className="text-xs text-brand hover:underline">View all →</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Course</th>
                <th>Phase</th>
                <th>Faculty</th>
                <th>Members</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTeams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <div>
                      <p className="font-medium">{team.ventureName ?? team.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.name}</p>
                    </div>
                  </td>
                  <td><span className="tag-gray tag">{team.course}</span></td>
                  <td><span className={`phase-badge ${phaseColor(team.currentPhase)} text-xs`}>{phaseLabel(team.currentPhase)}</span></td>
                  <td className="text-sm">{team.facultyGuide?.user.name ?? '—'}</td>
                  <td className="text-sm">{team.members.length}</td>
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(team.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent sign-ups</h3>
            <Link href="/admin/users" className="text-xs text-brand hover:underline">Manage users →</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.name ?? '—'}</td>
                  <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td>
                    <span className={`tag text-xs ${
                      user.role === 'ADMIN' ? 'tag-red' :
                      user.role === 'FACULTY' ? 'tag-purple' :
                      user.role === 'MENTOR' ? 'tag-amber' : 'tag-teal'
                    }`}>{user.role.toLowerCase()}</span>
                  </td>
                  <td className="text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
