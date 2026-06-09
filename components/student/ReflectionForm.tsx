'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'

const MONTHS = [
  'June 2026','July 2026','August 2026','September 2026',
  'October 2026','November 2026','December 2026',
  'January 2027','February 2027','March 2027','April 2027',
  'May 2027','June 2027','July 2027','August 2027',
  'September 2027','October 2027','November 2027','December 2027',
]

const QUESTIONS = [
  { key: 'whatAchieved',          label: 'What did the team achieve this month?',   placeholder: 'Describe your key accomplishments…' },
  { key: 'assumptionsValidated',  label: 'Which assumptions were validated?',        placeholder: 'What did you prove to be true?' },
  { key: 'assumptionsFailed',     label: 'Which assumptions failed or changed?',     placeholder: 'What turned out differently than expected?' },
  { key: 'userLearnings',         label: 'What did users teach you?',                placeholder: 'Key insights from customer interactions…' },
  { key: 'mentorRecommendations', label: 'What did your mentors recommend?',         placeholder: 'Key advice received this month…' },
  { key: 'aiContributions',       label: 'How did AI tools contribute this month?',  placeholder: 'Which AI tools helped and how?' },
  { key: 'nextSteps',             label: 'What will the team do next month?',        placeholder: 'Your top priorities for next month…' },
]

export function ReflectionForm({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [month, setMonth] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/dvl/api/reflections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, month, ...answers }),
    })
    setLoading(false)
    if (res.ok) { setSuccess(true); router.refresh() }
  }

  function reset() { setMonth(''); setAnswers({}); setSuccess(false) }

  const answeredCount = Object.values(answers).filter(v => v.trim()).length

  const modal = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', padding: '32px 16px 64px' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) { setOpen(false); reset() } }}
    >
      <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              {success ? 'Reflection submitted!' : 'Monthly reflection'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {success ? 'Saved and shared with your faculty and mentor.' : `${answeredCount} of ${QUESTIONS.length} questions answered`}
            </p>
          </div>
          {!loading && (
            <button onClick={() => { setOpen(false); reset() }} className="btn-ghost p-2">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {success ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--dvl-purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✍️</div>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Reflection saved</p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>Your faculty and mentor will review it.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => reset()} className="btn-secondary px-6">Add another</button>
              <button onClick={() => { setOpen(false); reset() }} className="btn-primary px-6">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Month *</label>
                <select required value={month} onChange={(e) => setMonth(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, background: 'white', outline: 'none' }}>
                  <option value="">— Select month —</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                Answer as many questions as you can. Only month is required.
              </p>
              {QUESTIONS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
                  <textarea rows={2}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' as const }}
                    value={answers[key] ?? ''}
                    onChange={(e) => setAnswers(a => ({ ...a, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '16px 28px 24px', borderTop: '1px solid var(--border)' }}>
              <button type="button" onClick={() => { setOpen(false); reset() }} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={loading || !month} className="btn-primary" style={{ flex: 2 }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit reflection'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return (
    <span>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Add reflection
      </button>
      {mounted && open && createPortal(modal, document.body)}
    </span>
  )
}
