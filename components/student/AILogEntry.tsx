'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, History, X, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'

interface LogVersion {
  id: string
  activity: string
  toolUsed: string
  purpose: string | null
  promptSummary: string | null
  outputGenerated: string | null
  humanValidation: string | null
  finalImplementation: string | null
  editedByName: string | null
  editedAt: string | Date
}

interface LogEntry {
  id: string
  activity: string
  toolUsed: string
  purpose: string | null
  promptSummary: string | null
  outputGenerated: string | null
  humanValidation: string | null
  finalImplementation: string | null
  loggedAt: string | Date
  createdByName: string | null
  editedAt: string | Date | null
  editedByName: string | null
  versions: LogVersion[]
}

interface AILogEntryProps {
  log: LogEntry
  tools: string[]
}

const FIELDS: { key: keyof LogEntry & keyof LogVersion; label: string }[] = [
  { key: 'purpose', label: 'Purpose' },
  { key: 'promptSummary', label: 'Prompt summary' },
  { key: 'outputGenerated', label: 'Output generated' },
  { key: 'humanValidation', label: 'Human validation' },
]

export function AILogEntry({ log, tools }: AILogEntryProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await apiFetch(`/api/ai-log/${log.id}`, { method: 'DELETE' })
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong while deleting. Please try again.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="tag-teal tag">{log.toolUsed}</span>
          <span className="text-sm font-medium">{log.activity}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>
            {log.editedAt ? `Edited ${formatDate(log.editedAt)}` : formatDate(log.loggedAt)}
          </span>
          {log.versions.length > 0 && (
            <button
              onClick={() => setHistoryOpen(true)}
              className="btn-ghost p-1.5"
              title="View edit history"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => { setError(null); setEditOpen(true) }}
            className="btn-ghost p-1.5"
            title="Edit entry"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { setError(null); setConfirmDelete(true) }}
            className="btn-ghost p-1.5"
            title="Archive entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {log.purpose && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Purpose</p>
            <p>{log.purpose}</p>
          </div>
        )}
        {log.promptSummary && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Prompt summary</p>
            <p>{log.promptSummary}</p>
          </div>
        )}
        {log.outputGenerated && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Output generated</p>
            <p>{log.outputGenerated}</p>
          </div>
        )}
        {log.humanValidation && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Human validation</p>
            <p>{log.humanValidation}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mt-3 rounded-lg text-sm"
             style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold mb-2">Archive this entry?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              "{log.activity}" will be removed from your log. Instructors can still review it and its edit history.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn-primary flex-1"
                style={{ background: '#dc2626' }}
                disabled={deleting}
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Archiving...</> : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyOpen && (
        <VersionHistoryModal log={log} onClose={() => setHistoryOpen(false)} />
      )}

      {editOpen && (
        <EditModal
          log={log}
          tools={tools}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh() }}
        />
      )}
    </div>
  )
}

function VersionHistoryModal({ log, onClose }: { log: LogEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-lg font-semibold">Edit history</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Earlier versions of "{log.activity}"
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="tag-purple tag">Current</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {log.editedAt
                  ? `Edited ${formatDate(log.editedAt)}${log.editedByName ? ` by ${log.editedByName}` : ''}`
                  : `Logged ${formatDate(log.loggedAt)}${log.createdByName ? ` by ${log.createdByName}` : ''}`}
              </span>
            </div>
            <VersionFields data={log} />
          </div>
          {log.versions.map((v) => (
            <div key={v.id} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="tag tag-teal">Previous version</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Replaced {formatDate(v.editedAt)}{v.editedByName ? ` by ${v.editedByName}` : ''}
                </span>
              </div>
              <VersionFields data={v} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function VersionFields({ data }: { data: LogVersion | LogEntry }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Tool used</p>
        <p>{data.toolUsed}</p>
      </div>
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Activity</p>
        <p>{data.activity}</p>
      </div>
      {FIELDS.map(({ key, label }) => {
        const value = data[key]
        if (!value) return null
        return (
          <div key={key}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p>{value as string}</p>
          </div>
        )
      })}
    </div>
  )
}

function EditModal({
  log, tools, onClose, onSaved,
}: {
  log: LogEntry
  tools: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    activity: log.activity,
    toolUsed: log.toolUsed,
    purpose: log.purpose ?? '',
    promptSummary: log.promptSummary ?? '',
    outputGenerated: log.outputGenerated ?? '',
    humanValidation: log.humanValidation ?? '',
    finalImplementation: log.finalImplementation ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/api/ai-log/${log.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong while saving. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, label: string, placeholder: string) => (
    <div>
      <label className="form-label">{label}</label>
      <textarea
        value={form[key]}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        rows={2}
        className="form-input resize-none"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-lg font-semibold">Edit AI usage entry</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              The previous version will be kept in the entry's edit history
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="form-label">Activity <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.activity}
              onChange={(e) => setForm(f => ({ ...f, activity: e.target.value }))}
              required
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Tool used <span className="text-red-500">*</span></label>
            <select
              value={form.toolUsed}
              onChange={(e) => setForm(f => ({ ...f, toolUsed: e.target.value }))}
              required
              className="form-input"
            >
              <option value="">Select a tool</option>
              {tools.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {field('purpose', 'Purpose', 'Why did you use this tool?')}
          {field('promptSummary', 'Prompt summary', 'Briefly describe the prompt you used')}
          {field('outputGenerated', 'Output generated', 'What did the AI produce?')}
          {field('humanValidation', 'Human validation', 'How did you verify the output?')}
          {field('finalImplementation', 'Final implementation', 'What did you actually use / how did you adapt the output?')}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                 style={{ background: 'rgba(220,38,38,0.08)', color: '#b91c1c' }}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
