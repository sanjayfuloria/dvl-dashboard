'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api-client'

interface AILogFormProps {
  teamId: string
  tools: string[]
}

export function AILogForm({ teamId, tools }: AILogFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    activity: '',
    toolUsed: '',
    purpose: '',
    promptSummary: '',
    outputGenerated: '',
    humanValidation: '',
    finalImplementation: '',
  })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/api/ai-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, teamId }),
      })
      setOpen(false)
      setForm({ activity: '', toolUsed: '', purpose: '', promptSummary: '', outputGenerated: '', humanValidation: '', finalImplementation: '' })
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong while saving. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, required = false) => (
    <div>
      <label className="form-label">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <textarea
        value={form[key]}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        required={required}
        rows={2}
        className="form-input resize-none"
      />
    </div>
  )

  return (
    <>
      <button onClick={() => { setError(null); setOpen(true) }} className="btn-primary">
        <Plus className="w-4 h-4" /> Log AI usage
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-semibold">Log AI usage</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Document how you used AI tools in your venture
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2">
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
                  placeholder="e.g. Generated customer survey questions"
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
                <button type="button" onClick={() => { setError(null); setOpen(false) }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
