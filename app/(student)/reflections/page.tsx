import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/utils'
import { ReflectionForm } from '@/components/student/ReflectionForm'
import { FileText, MessageSquare, ChevronDown } from 'lucide-react'
import { courseSlots, pickActiveMembership } from '@/lib/team-select'
import { CourseTabs } from '@/components/student/CourseTabs'

export const metadata = { title: 'Reflections' }

async function getTeamMemberships(userId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              reflections: {
                orderBy: { submittedAt: 'desc' },
                include: {
                  comments: {
                    include: {
                      faculty: { include: { user: true } },
                      mentor: { include: { user: true } },
                    },
                  },
                },
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

export default async function ReflectionsPage({
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
        title="Monthly Reflections"
        subtitle="Document your venture's learning journey"
        actions={team ? <ReflectionForm teamId={team.id} /> : undefined}
      />
      <div className="page-body space-y-5">
        <CourseTabs courses={courses} active={activeCourse} basePath="/reflections" />
        {!team ? (
          <div className="card text-center py-20">
            <FileText className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p>No team assigned yet</p>
          </div>
        ) : team.reflections.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium mb-1">No reflections submitted yet</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Monthly reflections help document your venture's evolution and learning.
            </p>
            <ReflectionForm teamId={team.id} />
          </div>
        ) : (
          team.reflections.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base">{r.month}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Submitted {formatDate(r.submittedAt)}
                  </p>
                </div>
                {r.comments.length > 0 && (
                  <span className="tag-teal tag">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {r.comments.length} comment{r.comments.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'What was achieved?', val: r.whatAchieved },
                  { label: 'Assumptions validated', val: r.assumptionsValidated },
                  { label: 'Assumptions that failed', val: r.assumptionsFailed },
                  { label: 'What users taught us', val: r.userLearnings },
                  { label: 'Mentor recommendations', val: r.mentorRecommendations },
                  { label: 'AI tool contributions', val: r.aiContributions },
                  { label: 'Next steps', val: r.nextSteps },
                ].filter(f => f.val).map(({ label, val }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-sm leading-relaxed">{val}</p>
                  </div>
                ))}
              </div>

              {r.comments.length > 0 && (
                <div className="mt-5 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Feedback
                  </p>
                  {r.comments.map((c) => {
                    const author = c.faculty?.user.name ?? c.mentor?.user.name ?? 'Guide'
                    const role = c.faculty ? 'Faculty' : 'Mentor'
                    return (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                             style={{ background: c.faculty ? 'var(--dvl-purple)' : 'var(--dvl-teal)' }}>
                          {author.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-medium">{author} <span style={{ color: 'var(--text-muted)' }}>· {role}</span></p>
                          <p className="text-sm mt-1">{c.comment}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
