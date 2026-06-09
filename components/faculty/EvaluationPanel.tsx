'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface EvaluationCriteria {
  key: string
  label: string
}

const PHASE_CRITERIA: Record<string, EvaluationCriteria[]> = {
  IDEATION: [
    { key: 'problemRelevance',    label: 'Problem relevance' },
    { key: 'validationQuality',   label: 'Validation quality' },
    { key: 'businessOpportunity', label: 'Business opportunity' },
    { key: 'clarityOfThinking',   label: 'Clarity of thinking' },
  ],
  PROTOTYPE: [
    { key: 'prototypeQuality',   label: 'Prototype quality' },
    { key: 'userCentricDesign',  label: 'User-centric design' },
    { key: 'feasibility',        label: 'Feasibility' },
    { key: 'aiIntegration',      label: 'AI integration' },
  ],
  MVP: [
    { key: 'mvpQuality',          label: 'MVP quality' },
    { key: 'productFunctionality',label: 'Product functionality' },
    { key: 'innovation',          label: 'Innovation' },
    { key: 'adoptionLogic',       label: 'Adoption logic' },
    { key: 'scalability',         label: 'Scalability' },
  ],
}

interface Props {
  team: { id: string; currentPhase: string; evaluations: any[] }
  facultyId: string
}

export function EvaluationPanel({ team, facultyId }: Props) {
  const [open, setOpen] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const criteria = PHASE_CRITERIA[team.currentPhase] ?? []
  const existingEval = team.evaluations.find(
    e => e.phase === team.currentPhase && e.evaluatorType === 'FACULTY' && e.facultyId === facultyId
  )

  async function handleSubmit() {
    setLoading(true)
    await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: team.id,
        phase: team.currentPhase,
        evaluatorType: 'FACULTY',
        facultyId,
        feedback,
        ...scores,
      }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const avg = Object.values(scores).length
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length).toFixed(1)
    : null

  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full"
      >
        <h3 className="flex items-center gap-2">
          <Star className="w-4 h-4" style={{ color: 'var(--dvl-amber)' }} />
          Evaluation — {team.currentPhase.charAt(0) + team.currentPhase.slice(1).toLowerCase()}
          {existingEval && (
            <span className="tag-green tag text-xs">Already submitted</span>
          )}
        </h3>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          {criteria.map(({ key, label }) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">{label}</label>
                <span className="text-sm font-semibold" style={{ color: 'var(--dvl-purple)' }}>
                  {scores[key] ?? '—'} / 10
                </span>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setScores(s => ({ ...s, [key]: n }))}
                    className="flex-1 h-8 rounded text-xs font-medium transition-all"
                    style={{
                      background: (scores[key] ?? 0) >= n ? 'var(--dvl-purple)' : 'var(--surface-raised)',
                      color: (scores[key] ?? 0) >= n ? 'white' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="form-label">Overall feedback</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Write your evaluation feedback for this team…"
              className="form-input resize-none"
            />
          </div>

          {avg && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--dvl-purple-dim)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--dvl-purple)' }} />
              <span className="text-sm" style={{ color: 'var(--dvl-purple)' }}>
                Average score: <strong>{avg} / 10</strong>
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || Object.keys(scores).length < criteria.length}
              className="btn-primary flex-1"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Submit evaluation'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
