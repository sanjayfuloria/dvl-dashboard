import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/layout/PageHeader'
import { Library, Search, ExternalLink, FileText, Wrench, BookOpen, Zap, Package, BookMarked } from 'lucide-react'

export const metadata = { title: 'Knowledge Hub' }

const TYPE_ICONS: Record<string, React.ElementType> = {
  READING: BookOpen,
  CASE: FileText,
  FRAMEWORK: Package,
  TEMPLATE: FileText,
  TOOLKIT: Wrench,
  PROMPT_LIBRARY: Zap,
  AI_GUIDE: Zap,
  PRODUCT_GUIDE: BookMarked,
}

const TYPE_LABELS: Record<string, string> = {
  READING: 'Reading',
  CASE: 'Case Study',
  FRAMEWORK: 'Framework',
  TEMPLATE: 'Template',
  TOOLKIT: 'Toolkit',
  PROMPT_LIBRARY: 'Prompt Library',
  AI_GUIDE: 'AI Guide',
  PRODUCT_GUIDE: 'Product Guide',
}

const TYPE_COLORS: Record<string, string> = {
  READING: 'tag-purple',
  CASE: 'tag-amber',
  FRAMEWORK: 'tag-teal',
  TEMPLATE: 'tag-gray',
  TOOLKIT: 'tag-green',
  PROMPT_LIBRARY: 'tag-purple',
  AI_GUIDE: 'tag-teal',
  PRODUCT_GUIDE: 'tag-gray',
}

async function getResources() {
  return prisma.resource.findMany({ orderBy: { createdAt: 'desc' } })
}

export default async function ResourcesPage() {
  const session = await getSession()
  if (!session) return null
  const resources = await getResources()

  const byType = resources.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {} as Record<string, typeof resources>)

  return (
    <div className="page-enter">
      <PageHeader
        title="Knowledge Hub"
        subtitle={`${resources.length} resources for your venture`}
      />
      <div className="page-body space-y-6">
        {resources.length === 0 ? (
          <div className="card text-center py-20">
            <Library className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium mb-1">No resources yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your faculty will upload resources here.
            </p>
          </div>
        ) : (
          Object.entries(byType).map(([type, items]) => {
            const Icon = TYPE_ICONS[type] ?? FileText
            return (
              <div key={type}>
                <h3 className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4" style={{ color: 'var(--dvl-purple)' }} />
                  {TYPE_LABELS[type] ?? type}
                  <span className="tag-gray tag text-xs">{items.length}</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((r) => {
                    const Icon2 = TYPE_ICONS[r.type] ?? FileText
                    return (
                      <div key={r.id} className="card-sm flex items-start gap-3 hover:shadow-sm transition-shadow">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                             style={{ background: 'var(--dvl-purple-dim)' }}>
                          <Icon2 className="w-4 h-4" style={{ color: 'var(--dvl-purple)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          {r.description && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                              {r.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.course && <span className="tag-gray tag text-[10px]">{r.course}</span>}
                            {r.tags.slice(0, 3).map(t => (
                              <span key={t} className="tag-gray tag text-[10px]">{t}</span>
                            ))}
                          </div>
                        </div>
                        {(r.fileUrl || r.driveFileId) && (
                          <a
                            href={r.fileUrl ?? `https://drive.google.com/file/d/${r.driveFileId}/view`}
                            target="_blank" rel="noopener noreferrer"
                            className="btn-ghost p-1.5 shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
