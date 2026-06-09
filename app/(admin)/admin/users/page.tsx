import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/utils'
import { UserManagementClient } from '@/components/admin/UserManagementClient'

export const metadata = { title: 'User Management' }

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      studentProfile: { include: { teamMembers: { include: { team: true } } } },
      facultyProfile: true,
      mentorProfile: true,
    },
  })
}

export default async function UsersPage() {
  const session = await getSession()
  if (!session) return null
  const users = await getUsers()

  return (
    <div className="page-enter">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users in the system`}
      />
      <div className="page-body">
        <UserManagementClient users={users} />
      </div>
    </div>
  )
}
