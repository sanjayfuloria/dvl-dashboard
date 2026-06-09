'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'

const MONTHS = [
  'January 2025','February 2025','March 2025','April 2025',
  'May 2025','June 2025','July 2025','August 2025',
  'September 2025','October 2025','November 2025','December 2025',
  'January 2026','February 2026','March 2026','April 2026',
  'May 2026','June 2026','July 2026','August 2026',
]

const QUESTIONS = [
  { key: 'whatAchieved',          label: 'What did the team achieve this month?' },
  { key: 'assumptionsValidated',  label: 'Which assumptions were validated?' },
  { key: 'assumptionsFailed',     label: 'Which assumptions failed or changed?' },
  { key: 'userLearnings',         label: 'What did users teach you?' },
  { key: 'mentorRecommendations', label: 'What did your mentors recommend?' },
  { key: 'aiContributions',       label: 'How did AI tools contribute this month?' },
  { key: 'nextSteps',             label: 'What will the team do next month?' },
]

export function ReflectionForm({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [month, setMonth] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/reflections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, month, ...answers }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      setMonth('')
      setAnswers({})
      router.refresh()
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Add reflection
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
             style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-lg font-semibold">Monthly reflection</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Document your venture's learning this month
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="form-label">Month <span className="text-red-500">*</span></label>
                <select value={month} onChange={(e) => setMonth(e.target.value)} required className="form-input">
                  <option value="">Select month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {QUESTIONS.map(({ key, label }) => (
                <div key={key}>
                  <label className="form-label">{label}</label>
                  <textarea
                    rows={2}
                    className="form-input resize-none"
                    value={answers[key] ?? ''}
                    onChange={(e) => setAnswers(a => ({ ...a, [key]: e.target.value }))}
                    placeholder="Share your team's thoughts…"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading || !month} className="btn-primary flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit reflection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
