'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, RotateCcw, ExternalLink, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Deliverable {
  id: string
  title: string
  type: string
  status: string
  fileUrl: string | null
  driveFileId: string | null
  submittedAt: string | null
  feedback: string | null
  milestone: { title: string; phase: string } | null
}

interface Props {
  teamId: string
  deliverables: Deliverable[]
}

function driveUrl(d: Deliverable): string {
  if (d.fileUrl) return d.fileUrl
  if (d.driveFileId) return 'https://drive.google.com/file/d/' + d.driveFileId + '/view'
  return '#'
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    SUBMITTED:   'bg-amber-100 text-amber-800',
    APPROVED:    'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    PENDING:     'bg-gray-100 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

export function DeliverableReview({ teamId, deliverables: initial }: Props) {
  const [items, setItems]       = useState(initial)
  const [open, setOpen]         = useState(true)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [saving, setSaving]     = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)
  const router = useRouter()

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000) }
  const pending  = items.filter(d => d.status === 'SUBMITTED')
  const reviewed = items.filter(d => d.status !== 'SUBMITTED' && d.status !== 'PENDING')

  async function act(deliverableId: string, action: string) {
    setSaving(deliverableId)
    const res = await fetch('/dvl/api/deliverables/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverableId, action, feedback: feedback[deliverableId] ?? '' }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems(prev => prev.map(d =>
        d.id === deliverableId ? { ...d, status: data.deliverable.status, feedback: data.deliverable.feedback } : d
      ))
      const label = action === 'approve' ? 'Approved' : action === 'request_revision' ? 'Revision requested' : 'Rejected'
      showToast(label)
      router.refresh()
    } else {
      showToast('Something went wrong')
    }
    setSaving(null)
  }

  return (
    <div className="card">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-sm font-semibold"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Deliverable Review
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
                  style={{ background: 'var(--dvl-amber)' }}>
              {pending.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {items.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No submissions yet.</p>
          )}

          {pending.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Awaiting review ({pending.length})
              </p>
              <div className="space-y-3">
                {pending.map(d => (
                  <div key={d.id} className="p-4 rounded-xl space-y-3"
                       style={{ border: '2px solid #fcd34d', background: '#fffbeb' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{d.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {d.type}
                          {d.milestone ? ' · ' + d.milestone.title : ''}
                          {d.submittedAt ? ' · Submitted ' + new Date(d.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </p>
                      </div>
                      {(d.fileUrl || d.driveFileId) && (
                        <a href={driveUrl(d)} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-xs shrink-0 hover:underline"
                           style={{ color: 'var(--dvl-teal)' }}>
                          <ExternalLink className="w-3.5 h-3.5" /> Open in Drive
                        </a>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Add feedback (optional)..."
                      value={feedback[d.id] ?? ''}
                      onChange={e => setFeedback(p => ({ ...p, [d.id]: e.target.value }))}
                      className="w-full text-sm px-3 py-2 rounded-lg border resize-none focus:outline-none"
                      style={{ borderColor: 'var(--border-default)', background: 'var(--surface-page)' }}
                    />

                    <div className="flex items-center gap-2">
                      <button disabled={saving === d.id} onClick={() => act(d.id, 'approve')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                              style={{ background: '#10b981' }}>
                        {saving === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button disabled={saving === d.id} onClick={() => act(d.id, 'request_revision')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                              style={{ background: 'var(--dvl-purple-dim)', color: 'var(--dvl-purple)' }}>
                        <RotateCcw className="w-3.5 h-3.5" /> Request revision
                      </button>
                      <button disabled={saving === d.id} onClick={() => act(d.id, 'reject')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                              style={{ background: '#fee2e2', color: '#dc2626' }}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviewed.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                Previously reviewed ({reviewed.length})
              </p>
              <div className="space-y-2">
                {reviewed.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg"
                       style={{ background: 'var(--surface-raised)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={'inline-block px-2 py-0.5 rounded text-xs font-medium shrink-0 ' + statusBadge(d.status)}>
                        {d.status.replace('_', ' ')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        {d.feedback && (
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            Feedback: {d.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                    {(d.fileUrl || d.driveFileId) && (
                      <a href={driveUrl(d)} target="_blank" rel="noopener noreferrer"
                         className="text-xs shrink-0 ml-2 hover:underline"
                         style={{ color: 'var(--dvl-teal)' }}>
                        Drive
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
