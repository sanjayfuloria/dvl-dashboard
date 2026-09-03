'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch, ApiError } from '@/lib/api-client'
import { phaseLabel } from '@/lib/utils'

const PHASES = ['IDEATION', 'PROTOTYPE', 'MVP'] as const

export function PhaseAdvanceControl({ teamId, currentPhase }: { teamId: string; currentPhase: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const currentIndex = PHASES.indexOf(currentPhase as typeof PHASES[number])
  const nextPhase = currentIndex >= 0 && currentIndex < PHASES.length - 1 ? PHASES[currentIndex + 1] : null

  async function handleAdvance() {
    if (!nextPhase) return
    if (!confirm(`Move this team to ${phaseLabel(nextPhase)}? They'll be able to upload deliverables for that phase.`)) return
    setLoading(true)
    setError(null)
    try {
      await apiFetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPhase: nextPhase }),
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not advance the phase. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!nextPhase) {
    return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Final phase reached</span>
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button onClick={handleAdvance} disabled={loading} className="btn-secondary text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
          Move to {phaseLabel(nextPhase)}
        </button>
        {error && (
          <span className="flex items-center gap-1 text-xs" style={{ color: '#b91c1c' }}>
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </span>
        )}
      </div>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        Applies to this team only. Unlocks upload for {phaseLabel(nextPhase)} deliverables — advance each team individually when they're ready.
      </p>
    </div>
  )
}
