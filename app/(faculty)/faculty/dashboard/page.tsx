import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, Briefcase, CheckSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Faculty Dashboard' }

export default async function FacultyDashboard() {
  const session = await getSession()
  if (!session || session.role !== 'FACULTY') redirect('/dvl/login')

  const [totalStudents, totalTeams, totalMilestones, teams] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.team.count(),
    prisma.milestone.count(),
    prisma.team.findMany({
      include: { members: { include: { student: { include: { user: { select: { name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  ])

  const stats = [
    { label: 'Total Students', value: totalStudents, icon: Users, color: '#7c6af7' },
    { label: 'Active Teams', value: totalTeams, icon: Briefcase, color: '#0d9488' },
    { label: 'Milestones', value: totalMilestones, icon: CheckSquare, color: '#f59e0b' },
    { label: 'Sections', value: 4, icon: TrendingUp, color: '#3b82f6' },
  ]

  return (
    <div className="page-enter">
      <PageHeader title="Faculty Dashboard" subtitle="Digital Venture Lab — IFHE Hyderabad · AY 2026-27" />
      <div className="page-body space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.color + '18' }}>
                  <s.icon style={{ color: s.color, width: 18, height: 18 }} />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-semibold">{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Recent Teams</h3>
            <Link href="/faculty/teams" className="text-sm font-medium" style={{ color: 'var(--dvl-purple)' }}>
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {teams.map(t => {
              const isIndividual = t.members.some((m: any) => m.role === 'Individual')
              return (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: t.course === 'MDT' ? '#7c6af7' : t.course === 'MPB' ? '#0d9488' : '#f59e0b' }}>
                      {t.course}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {isIndividual ? 'Individual project' : `${t.members.length} members`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: 'var(--dvl-purple-dim)', color: 'var(--dvl-purple)' }}>
                    Phase 1
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/faculty/teams" className="card hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--dvl-purple-dim)' }}>
              <Briefcase className="w-6 h-6" style={{ color: 'var(--dvl-purple)' }} />
            </div>
            <div>
              <p className="font-semibold">View All Teams</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Browse and evaluate student teams</p>
            </div>
          </Link>
          <Link href="/change-password" className="card hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <CheckSquare className="w-6 h-6" style={{ color: '#16a34a' }} />
            </div>
            <div>
              <p className="font-semibold">Change Password</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Update your account password</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
