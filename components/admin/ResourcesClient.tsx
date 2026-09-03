'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { apiFetch, ApiError } from '@/lib/api-client'

const RESOURCE_TYPES = [
  'READING', 'CASE', 'FRAMEWORK', 'TEMPLATE',
  'TOOLKIT', 'PROMPT_LIBRARY', 'AI_GUIDE', 'PRODUCT_GUIDE'
]
const TYPE_LABELS: Record<string, string> = {
  READING: 'Reading', CASE: 'Case Study', FRAMEWORK: 'Framework',
  TEMPLATE: 'Template', TOOLKIT: 'Toolkit', PROMPT_LIBRARY: 'Prompt Library',
  AI_GUIDE: 'AI Guide', PRODUCT_GUIDE: 'Product Guide',
}

interface Resource {
  id: string
  title: string
  type: string
  description: string | null
  fileUrl: string | null
  tags: string[]
  course: string | null
  createdAt: Date
}

export function ResourcesClient({ resources: initial }: { resources: Resource[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', type: 'READING', description: '',
    fileUrl: '', tags: '', course: '',
  })
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          course: form.course || undefined,
          fileUrl: form.fileUrl || undefined,
        }),
      })
      const created = await res.json()
      setResources(r => [created, ...r])
      setOpen(false)
      setForm({ title: '', type: 'READING', description: '', fileUrl: '', tags: '', course: '' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this resource. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this resource?')) return
    try {
      await apiFetch(`/api/resources/${id}`, { method: 'DELETE' })
      setResources(r => r.filter(x => x.id !== id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not delete this resource. Please try again.')
    }
  }

  return (
    <>
      <div className="flex justify-end mb-5">
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add resource
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Title</th><th>Type</th><th>Course</th><th>Tags</th><th>Added</th><th></th></tr>
          </thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id}>
                <td>
                  <p className="font-medium">{r.title}</p>
                  {r.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }} >{r.description.slice(0, 60)}…</p>}
                </td>
                <td><span className="tag-gray tag text-xs">{TYPE_LABELS[r.type] ?? r.type}</span></td>
                <td className="text-sm">{r.course ?? '—'}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {r.tags.slice(0, 3).map(t => <span key={t} className="tag-gray tag text-[10px]">{t}</span>)}
                  </div>
                </td>
                <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(r.createdAt)}</td>
                <td>
                  <div className="flex items-center gap-1">
                    {r.fileUrl && (
                      <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button onClick={() => handleDelete(r.id)} className="btn-ghost p-1.5 text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No resources yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold">Add resource</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input required className="form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {RESOURCE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Course</label>
                  <select className="form-input" value={form.course}
                    onChange={e => setForm(f => ({ ...f, course: e.target.value }))}>
                    <option value="">— Both courses —</option>
                    <option value="MPB">MPB</option>
                    <option value="MDT">MDT</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea rows={2} className="form-input resize-none" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">File / Drive URL</label>
                <input type="url" className="form-input" value={form.fileUrl}
                  onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://drive.google.com/…" />
              </div>
              <div>
                <label className="form-label">Tags (comma-separated)</label>
                <input className="form-input" value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="BMC, ideation, product" />
              </div>
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                     style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setError(null); setOpen(false) }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Add resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
