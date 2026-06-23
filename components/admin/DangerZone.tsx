'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'

type Scope = 'teams' | 'demoday' | 'all'

const ACTIONS: { scope: Scope; label: string; desc: string; color: string }[] = [
  { scope:'demoday', label:'Reset Demo Day',    desc:'Deletes all Demo Day events, slots, jury members, and scores. Teams and students are unaffected.', color:'#f59e0b' },
  { scope:'teams',   label:'Delete all teams',  desc:'Deletes all teams, milestones, deliverables, evaluations, AI logs, and reflections. Students remain.', color:'#ef4444' },
  { scope:'all',     label:'Full reset',         desc:'Deletes ALL teams AND the Demo Day. Students and user accounts are preserved.', color:'#7f1d1d' },
]

const CONFIRM_PHRASE = 'DELETE EVERYTHING'

export function DangerZone() {
  const [pending, setPending] = useState<Scope | null>(null)
  const [step, setStep] = useState<1|2>(1)
  const [loading, setLoading] = useState(false)
  const [typed, setTyped] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  if (typeof window !== 'undefined' && !mounted) setMounted(true)

  const action = ACTIONS.find(a => a.scope === pending)

  function open(scope: Scope) { setPending(scope); setStep(1); setTyped('') }
  function close() { if (!loading) { setPending(null); setStep(1); setTyped('') } }

  async function handleReset() {
    if (!pending) return
    setLoading(true)
    await fetch('/dvl/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: pending }),
    })
    setLoading(false)
    close()
    router.refresh()
  }

  return (
    <>
      <div className="card" style={{ border: '2px solid #fecaca' }}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4" style={{ color: '#ef4444' }} />
          <h3 className="font-semibold" style={{ color: '#dc2626' }}>Danger Zone</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          These actions are irreversible. Student accounts and login credentials are never deleted.
        </p>
        <div className="space-y-3">
          {ACTIONS.map(a => (
            <div key={a.scope} className="flex items-center justify-between p-3 rounded-lg"
              style={{ border: '1px solid #fecaca', background: '#fff5f5' }}>
              <div className="flex-1 mr-4">
                <p className="text-sm font-semibold" style={{ color: a.color }}>{a.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.desc}</p>
              </div>
              <button onClick={() => open(a.scope)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0"
                style={{ background: a.color }}>
                {a.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {pending && action && mounted && createPortal(
        <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
          onClick={e => { if (e.target === e.currentTarget) close() }}>
          <div style={{ background:'white',borderRadius:16,padding:28,maxWidth:440,width:'100%',boxShadow:'0 24px 80px rgba(0,0,0,0.3)' }}>

            {step === 1 && (
              <>
                <div style={{ width:52,height:52,borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                  <AlertTriangle style={{ width:26,height:26,color:'#dc2626' }} />
                </div>
                <h2 style={{ fontSize:18,fontWeight:700,textAlign:'center',marginBottom:8 }}>Are you sure?</h2>
                <p style={{ fontSize:13,color:'#6b7280',textAlign:'center',marginBottom:6 }}>
                  You are about to: <strong style={{ color: action.color }}>{action.label}</strong>
                </p>
                <p style={{ fontSize:13,color:'#6b7280',textAlign:'center',marginBottom:20 }}>{action.desc}</p>
                <p style={{ fontSize:12,fontWeight:700,color:'#dc2626',textAlign:'center',marginBottom:20 }}>This cannot be undone.</p>
                <div style={{ display:'flex',gap:12 }}>
                  <button onClick={close}
                    style={{ flex:1,padding:'10px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',fontSize:14 }}>
                    Cancel
                  </button>
                  <button onClick={() => setStep(2)}
                    style={{ flex:1,padding:'10px',borderRadius:8,border:'none',background:action.color,color:'white',cursor:'pointer',fontSize:14,fontWeight:600 }}>
                    Yes, continue →
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ width:52,height:52,borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                  <Trash2 style={{ width:26,height:26,color:'#dc2626' }} />
                </div>
                <h2 style={{ fontSize:18,fontWeight:700,textAlign:'center',marginBottom:8 }}>Final confirmation</h2>
                <p style={{ fontSize:13,color:'#6b7280',textAlign:'center',marginBottom:20 }}>
                  Type <strong style={{ color:'#dc2626',fontFamily:'monospace' }}>{CONFIRM_PHRASE}</strong> to confirm
                </p>
                <input autoFocus value={typed} onChange={e => setTyped(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  style={{ width:'100%',padding:'10px 12px',borderRadius:8,border:'2px solid #fecaca',fontSize:13,marginBottom:16,fontFamily:'monospace',textAlign:'center',outline:'none',boxSizing:'border-box' }}
                />
                <div style={{ display:'flex',gap:12 }}>
                  <button onClick={close} disabled={loading}
                    style={{ flex:1,padding:'10px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',fontSize:14 }}>
                    Cancel
                  </button>
                  <button onClick={handleReset} disabled={loading || typed !== CONFIRM_PHRASE}
                    style={{ flex:1,padding:'10px',borderRadius:8,border:'none',
                      background: typed === CONFIRM_PHRASE ? '#dc2626' : '#fca5a5',
                      color:'white',cursor: typed === CONFIRM_PHRASE ? 'pointer' : 'not-allowed',
                      fontSize:14,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                    {loading ? <Loader2 style={{ width:16,height:16 }} className="animate-spin" /> : <Trash2 style={{ width:16,height:16 }} />}
                    {loading ? 'Deleting...' : 'Confirm delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
