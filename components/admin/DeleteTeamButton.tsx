'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'

export function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Portal mount safety
  if (typeof window !== 'undefined' && !mounted) setMounted(true)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/dvl/api/teams/${teamId}`, { method: 'DELETE' })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-1.5 rounded hover:bg-red-50 transition-colors" title="Delete team">
        <Trash2 className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
      </button>

      {open && mounted && createPortal(
        <div style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
          onClick={e => { if (e.target === e.currentTarget && !loading) setOpen(false) }}>
          <div style={{ background:'white',borderRadius:16,padding:28,maxWidth:400,width:'100%',boxShadow:'0 24px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ width:48,height:48,borderRadius:'50%',background:'#fee2e2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
              <Trash2 style={{ width:22,height:22,color:'#dc2626' }} />
            </div>
            <h2 style={{ fontSize:18,fontWeight:700,textAlign:'center',marginBottom:8 }}>Delete team?</h2>
            <p style={{ fontSize:13,color:'#6b7280',textAlign:'center',marginBottom:24 }}>
              This will permanently delete <strong>{teamName}</strong> and all its milestones, deliverables, evaluations, and files. This cannot be undone.
            </p>
            <div style={{ display:'flex',gap:12 }}>
              <button onClick={() => setOpen(false)} disabled={loading}
                style={{ flex:1,padding:'10px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',fontSize:14 }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={loading}
                style={{ flex:1,padding:'10px',borderRadius:8,border:'none',background:'#dc2626',color:'white',cursor:'pointer',fontSize:14,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                {loading ? <Loader2 style={{ width:16,height:16 }} className="animate-spin" /> : <Trash2 style={{ width:16,height:16 }} />}
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
