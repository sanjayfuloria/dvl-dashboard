import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate } from '@/lib/utils'
import { ResourcesClient } from '@/components/admin/ResourcesClient'

export const metadata = { title: 'Resources' }

export default async function AdminResourcesPage() {
  const session = await getSession()
  if (!session) return null
  const resources = await prisma.resource.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="page-enter">
      <PageHeader title="Knowledge Repository" subtitle={`${resources.length} resources`} />
      <div className="page-body">
        <ResourcesClient resources={resources} />
      </div>
    </div>
  )
}
