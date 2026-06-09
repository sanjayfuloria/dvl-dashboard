import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { UserManagementClient } from '@/components/admin/UserManagementClient'
import { BulkImportButton } from '@/components/admin/BulkImportButton'

export const metadata = { title: 'User Management' }

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      studentProfile: true,
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
        actions={
          <div className="flex gap-2">
            <BulkImportButton />
          </div>
        }
      />
      <div className="page-body">
        <UserManagementClient users={users} />
      </div>
    </div>
  )
}
